import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PRODUCT_PRICES } from '@/lib/magic-frame-config';

export async function POST(req: NextRequest) {
    try {
        const { paymentKey, orderId, amount, productId, userId } = await req.json();

        if (!paymentKey || !orderId || !amount || !productId || !userId) {
            return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
        }

        // 1. 금액 위변조 방지 — DB 우선, 폴백으로 하드코딩
        let expectedPrice: number | undefined;
        let productName: string = productId;

        const { data: dbProduct } = await supabaseAdmin
            .from('magic_frame_products')
            .select('price, name')
            .eq('id', productId)
            .eq('active', true)
            .single();

        if (dbProduct) {
            expectedPrice = dbProduct.price;
            productName = dbProduct.name;
        } else {
            expectedPrice = PRODUCT_PRICES[productId];
        }

        if (!expectedPrice || Number(amount) !== expectedPrice) {
            return NextResponse.json({ error: '결제 금액이 올바르지 않습니다.' }, { status: 400 });
        }

        // 2. 사용자 존재 확인
        const { data: user, error: userError } = await supabaseAdmin
            .from('magic_frame_users')
            .select('id, name, phone')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 3. Toss Payments 결제 확인
        const secretKey = process.env.TOSS_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
        }

        const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });

        if (!tossRes.ok) {
            const err = await tossRes.json();
            console.error('Toss confirm error:', err);
            return NextResponse.json({ error: err.message || '결제 확인 실패' }, { status: 400 });
        }

        // 4. 주문 저장
        const { error: insertError } = await supabaseAdmin.from('magic_frame_orders').insert({
            user_id: userId,
            product_id: productId,
            product_name: productName,
            amount: Number(amount),
            quantity: 1,
            toss_order_id: orderId,
            toss_payment_key: paymentKey,
            status: 'paid',
            buyer_name: user.name,
            buyer_phone: user.phone,
        });

        if (insertError) {
            console.error('Order save error:', insertError);
            return NextResponse.json({ error: '주문 저장 실패' }, { status: 500 });
        }

        return NextResponse.json({ success: true, productName });
    } catch (e: any) {
        console.error('Order confirm error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
