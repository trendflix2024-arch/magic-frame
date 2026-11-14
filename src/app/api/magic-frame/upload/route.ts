import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { newPhotoPath, photoPathFromUrl } from '@/lib/magic-frame-photo-path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const userId = formData.get('userId') as string;
        const imageType = (formData.get('imageType') as string) || 'single';
        const file = formData.get('image') as File | null;

        if (!userId || !file) {
            return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
        }

        // Get user info for filename
        const { data: user, error: userError } = await supabaseAdmin
            .from('magic_frame_users')
            .select('name, phone, submitted, submitted_at, image_url')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        if (user.submitted) {
            return NextResponse.json({ error: '이미 제출된 사용자입니다.' }, { status: 400 });
        }

        // Vercel 엣지 4.5MB body limit — 함수 도달 전 차단됨. 클라이언트는 4MB 이하로 압축 후 전송.
        const buffer = Buffer.from(await file.arrayBuffer());

        if (buffer.byteLength > 4.2 * 1024 * 1024) {
            return NextResponse.json({ error: '이미지 크기가 너무 큽니다. 다시 시도해 주세요.' }, { status: 400 });
        }

        // 매 업로드마다 새 무작위 경로에 저장한다 (고객 ID 로 주소를 추측할 수 없게)
        const filename = newPhotoPath(userId);
        const previousPath = photoPathFromUrl((user as any).image_url);

        // Ensure bucket exists
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        if (!buckets?.find(b => b.name === 'magic-frame')) {
            await supabaseAdmin.storage.createBucket('magic-frame', { public: true });
        }

        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from('magic-frame')
            .upload(filename, buffer, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', JSON.stringify(uploadError));
            return NextResponse.json({ error: `업로드 실패: ${uploadError.message}` }, { status: 500 });
        }

        // Get public URL (cache-bust 파라미터로 재제출 시 CDN 캐시 우회)
        const { data: urlData } = supabaseAdmin.storage
            .from('magic-frame')
            .getPublicUrl(filename);

        const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

        // Update user record — submitted_at 은 첫 제출 시에만 설정 (재제출 시 원래 시각 보존)
        const now = new Date().toISOString();
        const updatePayload: Record<string, any> = {
            submitted: true,
            image_url: publicUrl,
            image_type: imageType,
            updated_at: now,
        };
        if (!(user as any).submitted_at) {
            updatePayload.submitted_at = now;
        }
        const { error: updateError } = await supabaseAdmin
            .from('magic_frame_users')
            .update(updatePayload)
            .eq('id', userId);

        if (updateError) {
            // DB 에 기록하지 못했으면 방금 올린 파일을 남기지 않는다
            await supabaseAdmin.storage.from('magic-frame').remove([filename]);
            return NextResponse.json({ error: '데이터 업데이트에 실패했습니다.' }, { status: 500 });
        }

        // 재제출이면 이전 사진을 지운다 (예전 형식 `${userId}.jpg` 포함). 실패해도 제출은 성공으로 본다.
        const stale = [previousPath, `${userId}.jpg`].filter((p): p is string => !!p && p !== filename);
        if (stale.length) {
            try { await supabaseAdmin.storage.from('magic-frame').remove(stale); } catch { /* non-critical */ }
        }

        return NextResponse.json({ success: true, imageUrl: publicUrl });
    } catch (e: any) {
        console.error('Upload route error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
