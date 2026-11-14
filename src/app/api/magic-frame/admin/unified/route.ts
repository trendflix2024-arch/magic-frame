import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminAuth } from '@/lib/admin-auth';

const USER_COLUMNS = 'id, name, haengbun, phone, submitted, image_url, image_type, updated_at, created_at, shipping_status, address, postal_code, address_detail, tracking_number, shipping_carrier, shipping_memo, shipped_at';

function getUnifiedStatus(submitted: boolean, shippingStatus: string): string {
    if (!submitted) return 'waiting';
    switch (shippingStatus) {
        case 'pending': return 'received';
        case 'new_order': return 'producing';
        case 'preparing': return 'preparing';
        case 'shipped': return 'shipped';
        default: return 'received';
    }
}

interface FilterParams {
    search: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    allowedUserIds?: string[] | null;
    excludedUserIds?: string[] | null;
}

function buildUserQuery(params: FilterParams, forCount = false) {
    let q = supabaseAdmin
        .from('magic_frame_users')
        .select(forCount ? 'id' : USER_COLUMNS, forCount ? { count: 'exact', head: true } : undefined);

    if (params.search) {
        q = q.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,haengbun.ilike.%${params.search}%`);
    }
    if (params.dateFrom) q = q.gte('created_at', params.dateFrom);
    if (params.dateTo) q = q.lte('created_at', params.dateTo);

    if (params.allowedUserIds) {
        // 해당 출처 고객이 0명이면 빈 결과를 돌려준다. id 는 uuid 컬럼이라 uuid 형식 값이어야 한다.
        if (params.allowedUserIds.length === 0) q = q.eq('id', '00000000-0000-0000-0000-000000000000');
        else q = q.in('id', params.allowedUserIds);
    }
    if (params.excludedUserIds && params.excludedUserIds.length) {
        q = q.not('id', 'in', `(${params.excludedUserIds.join(',')})`);
    }

    switch (params.status) {
        case 'waiting': q = q.eq('submitted', false); break;
        case 'received': q = q.eq('submitted', true).eq('shipping_status', 'pending'); break;
        case 'producing': q = q.eq('submitted', true).eq('shipping_status', 'new_order'); break;
        case 'preparing': q = q.eq('submitted', true).eq('shipping_status', 'preparing'); break;
        case 'shipped': q = q.eq('submitted', true).eq('shipping_status', 'shipped'); break;
    }
    return q;
}

async function resolveSourceFilter(source: string): Promise<{ allowedUserIds: string[] | null; excludedUserIds: string[] | null }> {
    if (source === 'all') return { allowedUserIds: null, excludedUserIds: null };
    const { data: blob } = await supabaseAdmin.storage.from('magic-frame').download('user-sources.json');
    let map: Record<string, string> = {};
    if (blob) {
        try { map = JSON.parse(await blob.text()); } catch { map = {}; }
    }
    const allowedUserIds = Object.entries(map)
        .filter(([, src]) => src === source)
        .map(([uid]) => uid);
    return { allowedUserIds, excludedUserIds: null };
}

export async function GET(req: NextRequest) {
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const source = url.searchParams.get('source') || 'all';
    const sort = url.searchParams.get('sort') || 'recent';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';
    const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 200);
    const offset = Math.max(Number(url.searchParams.get('offset') || '0'), 0);

    const { allowedUserIds, excludedUserIds } = await resolveSourceFilter(source);
    const filterParams: FilterParams = { search, status, dateFrom, dateTo, allowedUserIds, excludedUserIds };

    // 1. Paginated users query
    let userQuery = buildUserQuery(filterParams, false) as any;
    if (sort === 'name') userQuery = userQuery.order('name', { ascending: true });
    else userQuery = userQuery.order('updated_at', { ascending: false, nullsFirst: false });
    userQuery = userQuery.range(offset, offset + limit - 1);

    // 2. Total count for current filter
    const countQuery = buildUserQuery(filterParams, true) as any;

    // 3. Pipeline counts (always unfiltered by status, respects search/date/source)
    const baseCountParams: FilterParams = { search, dateFrom, dateTo, status: 'all', allowedUserIds, excludedUserIds };
    const allCountQ = buildUserQuery({ ...baseCountParams, status: 'all' }, true) as any;
    const waitingCountQ = buildUserQuery({ ...baseCountParams, status: 'waiting' }, true) as any;
    const receivedCountQ = buildUserQuery({ ...baseCountParams, status: 'received' }, true) as any;
    const producingCountQ = buildUserQuery({ ...baseCountParams, status: 'producing' }, true) as any;
    const preparingCountQ = buildUserQuery({ ...baseCountParams, status: 'preparing' }, true) as any;
    const shippedCountQ = buildUserQuery({ ...baseCountParams, status: 'shipped' }, true) as any;

    // 4. KPI: period new (= filtered total ignoring status). When date filter is "all" this equals total.
    const periodNewQ = buildUserQuery({ ...filterParams, status: 'all' }, true) as any;

    // Run all in parallel
    const [
        { data: users, error: usersError },
        { count: total },
        { count: allCount },
        { count: waitingCount },
        { count: receivedCount },
        { count: producingCount },
        { count: preparingCount },
        { count: shippedCount },
        { count: periodNew },
    ] = await Promise.all([
        userQuery, countQuery, allCountQ, waitingCountQ, receivedCountQ, producingCountQ, preparingCountQ, shippedCountQ, periodNewQ,
    ]);

    if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // 5. Fetch add-on orders for the users on this page (N+1 avoided)
    const userIds = (users || []).map((u: any) => u.id);
    const { data: orders } = userIds.length
        ? await supabaseAdmin.from('magic_frame_orders').select('*').in('user_id', userIds)
        : { data: [] as any[] };

    const ordersByUser: Record<string, any[]> = {};
    for (const order of orders || []) {
        (ordersByUser[order.user_id] ||= []).push(order);
    }

    const unified = (users || []).map((user: any) => ({
        ...user,
        unified_status: getUnifiedStatus(user.submitted, user.shipping_status || 'pending'),
        addon_orders: ordersByUser[user.id] || [],
    }));

    return NextResponse.json({
        orders: unified,
        total: total || 0,
        limit,
        offset,
        counts: {
            waiting: waitingCount || 0,
            received: receivedCount || 0,
            producing: producingCount || 0,
            preparing: preparingCount || 0,
            shipped: shippedCount || 0,
            total: allCount || 0,
        },
        kpi: {
            total: allCount || 0,
            todayNew: periodNew || 0,
            pendingShipment: (receivedCount || 0) + (producingCount || 0) + (preparingCount || 0),
        },
    });
}
