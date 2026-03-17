import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const { name, phone } = await req.json();

        if (!name || !phone) {
            return NextResponse.json({ error: '이름과 연락처를 입력해주세요.' }, { status: 400 });
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');

        const { data: user, error: userError } = await supabaseAdmin
            .from('magic_frame_users')
            .select('id, name, phone, submitted, image_url, image_type, updated_at, created_at, shipping_status, address, postal_code, address_detail, tracking_number, shipping_carrier, shipping_memo, shipped_at')
            .eq('name', name.trim())
            .eq('phone', cleanPhone)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: '주문 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        if (!user.submitted) {
            return NextResponse.json({
                found: true,
                submitted: false,
                message: '아직 사진이 접수되지 않았습니다.',
            });
        }

        // Fetch addon orders
        const { data: addonOrders } = await supabaseAdmin
            .from('magic_frame_orders')
            .select('id, product_id, product_name, amount, quantity, status, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        // Compute unified status
        let unified_status = 'received';
        switch (user.shipping_status) {
            case 'pending': unified_status = 'received'; break;
            case 'new_order': unified_status = 'producing'; break;
            case 'preparing': unified_status = 'preparing'; break;
            case 'shipped': unified_status = 'shipped'; break;
        }

        return NextResponse.json({
            found: true,
            submitted: true,
            order: {
                name: user.name,
                image_url: user.image_url,
                created_at: user.created_at,
                updated_at: user.updated_at,
                unified_status,
                shipping_status: user.shipping_status,
                address: user.address,
                postal_code: user.postal_code,
                address_detail: user.address_detail,
                tracking_number: user.tracking_number,
                shipping_carrier: user.shipping_carrier,
                shipping_memo: user.shipping_memo,
                shipped_at: user.shipped_at,
                addon_orders: (addonOrders || []).filter(o => o.status !== 'cancelled'),
            },
        });
    } catch {
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
