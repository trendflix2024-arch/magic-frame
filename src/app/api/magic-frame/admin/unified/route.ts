import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

const USER_COLUMNS = 'id, name, phone, submitted, image_url, image_type, updated_at, created_at, shipping_status, address, postal_code, address_detail, tracking_number, shipping_carrier, shipping_memo, shipped_at';

// Unified status mapping
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

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const sort = url.searchParams.get('sort') || 'recent';

    // 1. Fetch users
    let userQuery = supabaseAdmin
        .from('magic_frame_users')
        .select(USER_COLUMNS);

    if (search) {
        userQuery = userQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Pre-filter by DB fields when possible
    if (status === 'waiting') {
        userQuery = userQuery.eq('submitted', false);
    } else if (status === 'received') {
        userQuery = userQuery.eq('submitted', true).eq('shipping_status', 'pending');
    } else if (status === 'producing') {
        userQuery = userQuery.eq('submitted', true).eq('shipping_status', 'new_order');
    } else if (status === 'preparing') {
        userQuery = userQuery.eq('submitted', true).eq('shipping_status', 'preparing');
    } else if (status === 'shipped') {
        userQuery = userQuery.eq('submitted', true).eq('shipping_status', 'shipped');
    }

    if (sort === 'name') {
        userQuery = userQuery.order('name', { ascending: true });
    } else {
        userQuery = userQuery.order('updated_at', { ascending: false, nullsFirst: false });
    }

    const { data: users, error: usersError } = await userQuery;

    if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // 2. Fetch all orders
    const { data: orders, error: ordersError } = await supabaseAdmin
        .from('magic_frame_orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (ordersError) {
        console.warn('Orders fetch error (continuing without orders):', ordersError.message);
    }

    // 3. Group orders by user_id
    const ordersByUser: Record<string, any[]> = {};
    if (orders) {
        for (const order of orders) {
            (ordersByUser[order.user_id] ||= []).push(order);
        }
    }

    // 4. Build unified response
    const unified = (users || []).map(user => ({
        ...user,
        unified_status: getUnifiedStatus(user.submitted, user.shipping_status || 'pending'),
        addon_orders: ordersByUser[user.id] || [],
    }));

    // 5. Compute counts for all statuses (before filtering)
    // If we pre-filtered, we need separate count query
    let counts;
    if (status === 'all' && !search) {
        counts = {
            waiting: unified.filter(u => u.unified_status === 'waiting').length,
            received: unified.filter(u => u.unified_status === 'received').length,
            producing: unified.filter(u => u.unified_status === 'producing').length,
            preparing: unified.filter(u => u.unified_status === 'preparing').length,
            shipped: unified.filter(u => u.unified_status === 'shipped').length,
            total: unified.length,
        };
    } else {
        // Fetch counts separately
        const { count: totalCount } = await supabaseAdmin
            .from('magic_frame_users').select('*', { count: 'exact', head: true });
        const { count: waitingCount } = await supabaseAdmin
            .from('magic_frame_users').select('*', { count: 'exact', head: true }).eq('submitted', false);
        const { count: receivedCount } = await supabaseAdmin
            .from('magic_frame_users').select('*', { count: 'exact', head: true }).eq('submitted', true).eq('shipping_status', 'pending');
        const { count: producingCount } = await supabaseAdmin
            .from('magic_frame_users').select('*', { count: 'exact', head: true }).eq('submitted', true).eq('shipping_status', 'new_order');
        const { count: preparingCount } = await supabaseAdmin
            .from('magic_frame_users').select('*', { count: 'exact', head: true }).eq('submitted', true).eq('shipping_status', 'preparing');
        const { count: shippedCount } = await supabaseAdmin
            .from('magic_frame_users').select('*', { count: 'exact', head: true }).eq('submitted', true).eq('shipping_status', 'shipped');

        counts = {
            waiting: waitingCount || 0,
            received: receivedCount || 0,
            producing: producingCount || 0,
            preparing: preparingCount || 0,
            shipped: shippedCount || 0,
            total: totalCount || 0,
        };
    }

    return NextResponse.json({ orders: unified, counts });
}
