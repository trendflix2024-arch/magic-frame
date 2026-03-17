import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
const BUCKET = 'magic-frame';
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('image') as File | null;
        const productId = formData.get('productId') as string;

        if (!file || !productId) {
            return NextResponse.json({ error: '이미지와 상품 ID가 필요합니다.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        if (buffer.byteLength > MAX_SIZE) {
            return NextResponse.json({ error: '이미지 크기가 2MB를 초과합니다.' }, { status: 400 });
        }

        // Determine extension from content type
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        const filename = `products/${productId}.${ext}`;

        // Ensure bucket exists
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        if (!buckets?.find(b => b.name === BUCKET)) {
            await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
        }

        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(filename, buffer, {
                contentType: file.type || 'image/jpeg',
                upsert: true,
            });

        if (uploadError) {
            console.error('Product image upload error:', uploadError);
            return NextResponse.json({ error: `업로드 실패: ${uploadError.message}` }, { status: 500 });
        }

        const { data: urlData } = supabaseAdmin.storage
            .from(BUCKET)
            .getPublicUrl(filename);

        return NextResponse.json({ imageUrl: urlData.publicUrl });
    } catch (e: any) {
        console.error('Product image upload error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
