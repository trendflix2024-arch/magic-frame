import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

function formatPhone(phone: string) {
    if (phone.length === 11) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    if (phone.length === 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    return phone;
}

// GET: Export shipping data as CSV
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || '';

    let query = supabaseAdmin
        .from('magic_frame_users')
        .select('name, phone, postal_code, address, address_detail, shipping_memo, shipping_status, tracking_number, shipping_carrier')
        .eq('submitted', true);

    if (status && status !== 'all') {
        query = query.eq('shipping_status', status);
    }

    query = query.order('name', { ascending: true });

    const { data: users, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build CSV
    const header = '이름,연락처,우편번호,주소,상세주소,배송메모,배송상태,운송장번호,택배사';
    const rows = (users || []).map(u => {
        const fields = [
            u.name,
            formatPhone(u.phone),
            u.postal_code || '',
            u.address || '',
            u.address_detail || '',
            u.shipping_memo || '',
            u.shipping_status || '',
            u.tracking_number || '',
            u.shipping_carrier || '',
        ];
        return fields.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',');
    });

    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="shipping_${date}.csv"`,
        },
    });
}
