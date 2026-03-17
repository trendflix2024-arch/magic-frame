import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

// GET: 주문 목록
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const sort = url.searchParams.get('sort') || 'recent';

    let query = supabase
        .from('magic_frame_orders')
        .select('*');

    if (search) {
        query = query.or(`buyer_name.ilike.%${search}%,buyer_phone.ilike.%${search}%,product_name.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (sort === 'amount') {
        query = query.order('amount', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data: orders, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
}

// PATCH: 주문 상태 변경
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { orderId, status } = await req.json();
        if (!orderId || !status) {
            return NextResponse.json({ error: '주문 ID와 상태가 필요합니다.' }, { status: 400 });
        }

        const validStatuses = ['paid', 'shipped', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: '올바르지 않은 상태입니다.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('magic_frame_orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', orderId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
