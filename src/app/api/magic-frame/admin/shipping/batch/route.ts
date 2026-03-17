import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

// PATCH: Batch update shipping status
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { userIds, shipping_status, shipping_carrier, tracking_number } = await req.json();

        if (!userIds?.length || !shipping_status) {
            return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
        }

        const validStatuses = ['pending', 'new_order', 'preparing', 'shipped'];
        if (!validStatuses.includes(shipping_status)) {
            return NextResponse.json({ error: '유효하지 않은 상태입니다.' }, { status: 400 });
        }

        const updateData: Record<string, any> = {
            shipping_status,
            updated_at: new Date().toISOString(),
        };

        if (shipping_carrier !== undefined) updateData.shipping_carrier = shipping_carrier;
        if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
        if (shipping_status === 'shipped') updateData.shipped_at = new Date().toISOString();

        const { error } = await supabaseAdmin
            .from('magic_frame_users')
            .update(updateData)
            .in('id', userIds);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: userIds.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
