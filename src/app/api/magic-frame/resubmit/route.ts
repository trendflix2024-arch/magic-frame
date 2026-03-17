import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
        }

        // Fetch user
        const { data: user, error: fetchError } = await supabaseAdmin
            .from('magic_frame_users')
            .select('submitted, updated_at')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        if (!user.submitted) {
            return NextResponse.json({ error: '제출 상태가 아닙니다.' }, { status: 400 });
        }

        // Check 30-minute window
        if (user.updated_at) {
            const submittedAt = new Date(user.updated_at).getTime();
            const elapsed = Date.now() - submittedAt;
            if (elapsed > 30 * 60 * 1000) {
                return NextResponse.json({ error: '제출 후 30분이 경과하여 재제출이 불가합니다.' }, { status: 400 });
            }
        }

        // Reset submission
        const { error } = await supabaseAdmin
            .from('magic_frame_users')
            .update({
                submitted: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
