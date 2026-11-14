import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkTrackLimit, getClientIp } from '@/lib/ratelimit';

function maskAddress(addr: string | null): string | null {
    if (!addr) return addr;
    return addr.replace(/\d+(?=[^\d]*$)/, m => '*'.repeat(m.length));
}

function maskDetail(detail: string | null): string | null {
    if (!detail) return detail;
    return detail.replace(/\d/g, '*');
}

function maskPostal(code: string | null): string | null {
    if (!code || code.length < 3) return code;
    return code.slice(0, 2) + '*'.repeat(code.length - 2);
}

const SELECT_FIELDS = 'id, name, phone, submitted, image_url, image_type, updated_at, created_at, shipping_status, address, postal_code, address_detail, tracking_number, shipping_carrier, shipping_memo, shipped_at';

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const allowed = await checkTrackLimit(ip);
        if (!allowed) {
            return NextResponse.json(
                { error: '요청이 너무 많습니다. 1분 후 다시 시도해주세요.' },
                { status: 429 }
            );
        }

        const { name, phone, haengbun } = await req.json();

        if (!name || (!phone && !haengbun)) {
            return NextResponse.json({ error: '이름과 행번(또는 연락처)을 입력해주세요.' }, { status: 400 });
        }

        const cleanName = name.trim();
        let user: any = null;
        let userError: any = null;

        if (haengbun) {
            const { data, error } = await supabaseAdmin
                .from('magic_frame_users')
                .select(SELECT_FIELDS)
                .eq('name', cleanName)
                .eq('haengbun', String(haengbun).trim())
                .single();
            user = data;
            userError = error;
        } else {
            const cleanPhone = String(phone).replace(/[^0-9]/g, '');
            const { data, error } = await supabaseAdmin
                .from('magic_frame_users')
                .select(SELECT_FIELDS)
                .eq('name', cleanName)
                .eq('phone', cleanPhone)
                .single();
            user = data;
            userError = error;
        }

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

        const { data: addonOrders } = await supabaseAdmin
            .from('magic_frame_orders')
            .select('id, product_id, product_name, amount, quantity, status, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

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
                address: maskAddress(user.address),
                postal_code: maskPostal(user.postal_code),
                address_detail: maskDetail(user.address_detail),
                tracking_number: user.tracking_number,
                shipping_carrier: user.shipping_carrier,
                shipping_memo: user.shipping_memo,
                shipped_at: user.shipped_at,
                addon_orders: (addonOrders || []).filter(o => o.status !== 'cancelled'),
            },
        });
    } catch (e) {
        console.error('track route error:', e);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
