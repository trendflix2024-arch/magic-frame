import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { name, phone } = await req.json();
        if (!name?.trim() || !phone?.trim()) {
            return NextResponse.json({ error: '이름과 연락처를 입력해 주세요.' }, { status: 400 });
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const cleanName = name.trim();

        // Check if user exists
        const { data: existing } = await supabase
            .from('magic_frame_users')
            .select('id, submitted, image_url, updated_at')
            .eq('name', cleanName)
            .eq('phone', cleanPhone)
            .single();

        if (!existing) {
            return NextResponse.json({
                error: '등록되지 않은 사용자입니다. 관리자에게 문의해주세요.',
            }, { status: 404 });
        }

        if (existing.submitted) {
            return NextResponse.json({
                submitted: true,
                userId: existing.id,
                updatedAt: existing.updated_at,
                message: '사진이 확정되어 제작 중에 있습니다. 사진 변경을 원하시면 이메일로 문의해 주세요.',
            }, { status: 200 });
        }

        return NextResponse.json({ userId: existing.id, submitted: false });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
