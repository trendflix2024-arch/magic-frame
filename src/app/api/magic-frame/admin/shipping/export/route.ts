import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminAuth } from '@/lib/admin-auth';
import { getSource } from '@/lib/magic-frame-sources';

function formatPhone(phone: string) {
    if (!phone) return '';
    if (phone.length === 11) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    if (phone.length === 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    return phone;
}

// Vercel 함수는 UTC. 엑셀 datetime 인식되는 YYYY-MM-DD HH:mm 으로 KST 변환.
function formatKstDateTime(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const Y = kst.getUTCFullYear();
    const M = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const D = String(kst.getUTCDate()).padStart(2, '0');
    const h = String(kst.getUTCHours()).padStart(2, '0');
    const m = String(kst.getUTCMinutes()).padStart(2, '0');
    return `${Y}-${M}-${D} ${h}:${m}`;
}

// GET: Export shipping data as CSV (respects search/status/date filters)
export async function GET(req: NextRequest) {
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';
    const submittedOnly = url.searchParams.get('submittedOnly') !== 'false';

    // Map unified status to shipping_status
    const statusMap: Record<string, { submitted: boolean; shipping?: string }> = {
        waiting: { submitted: false },
        received: { submitted: true, shipping: 'pending' },
        producing: { submitted: true, shipping: 'new_order' },
        preparing: { submitted: true, shipping: 'preparing' },
        shipped: { submitted: true, shipping: 'shipped' },
    };

    // PostgREST 1000행 cap 회피 — range 페이지네이션으로 전수 조회
    const buildQuery = () => {
        let q = supabaseAdmin
            .from('magic_frame_users')
            .select('name, haengbun, phone, postal_code, address, address_detail, shipping_memo, shipping_status, tracking_number, shipping_carrier, created_at, submitted_at, updated_at, submitted, source');
        if (submittedOnly) q = q.eq('submitted', true);
        if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%,haengbun.ilike.%${search}%`);
        if (dateFrom) q = q.gte('created_at', dateFrom);
        if (dateTo) q = q.lte('created_at', dateTo);
        if (status && status !== 'all' && statusMap[status]) {
            const m = statusMap[status];
            q = q.eq('submitted', m.submitted);
            if (m.shipping) q = q.eq('shipping_status', m.shipping);
        }
        // 등록 순(=실제 제출 순) 정렬. 미제출 row 는 뒤로.
        return q
            .order('submitted_at', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true });
    };

    const PAGE = 1000;
    const users: any[] = [];
    for (let offset = 0; ; offset += PAGE) {
        const { data, error } = await buildQuery().range(offset, offset + PAGE - 1);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        if (!data?.length) break;
        users.push(...data);
        if (data.length < PAGE) break;
    }

    const header = '번호,이름,행번,연락처,우편번호,주소,상세주소,배송메모,배송상태,운송장번호,택배사,등록일,출처';
    const rows = users.map((u, i) => {
        const fields = [
            i + 1,
            u.name,
            u.haengbun || '',
            formatPhone(u.phone),
            u.postal_code || '',
            u.address || '',
            u.address_detail || '',
            u.shipping_memo || '',
            u.shipping_status || '',
            u.tracking_number || '',
            u.shipping_carrier || '',
            // 실제 고객 제출 시각 우선. 없으면 updated_at 근사 (대부분 admin 미터치 상태). 둘 다 없으면 빈칸.
            formatKstDateTime(u.submitted ? (u.submitted_at || u.updated_at) : null),
            getSource(u.source)?.label || '',
        ];
        return fields.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',');
    });

    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="orders_${date}.csv"`,
        },
    });
}
