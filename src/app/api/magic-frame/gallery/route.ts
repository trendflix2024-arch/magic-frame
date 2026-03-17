import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

// GET: 갤러리 이미지 목록 (누구나 접근 가능)
export async function GET() {
    try {
        const { data: files, error } = await supabase.storage
            .from('magic-frame')
            .list('gallery', { sortBy: { column: 'created_at', order: 'desc' } });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const images = (files || [])
            .filter(f => f.name && !f.name.startsWith('.'))
            .map(f => {
                const { data } = supabase.storage.from('magic-frame').getPublicUrl(`gallery/${f.name}`);
                return {
                    name: f.name,
                    url: data.publicUrl,
                    createdAt: f.created_at,
                };
            });

        return NextResponse.json({ images });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: 이미지 업로드 (관리자 전용)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!isAdmin(session?.user?.email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { imageBase64, filename } = await req.json();
        if (!imageBase64) {
            return NextResponse.json({ error: '이미지 데이터가 필요합니다.' }, { status: 400 });
        }

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        if (buffer.byteLength > 5 * 1024 * 1024) {
            return NextResponse.json({ error: '이미지 크기가 5MB를 초과합니다.' }, { status: 400 });
        }

        const safeName = `${Date.now()}_${(filename || 'image').replace(/[^a-zA-Z0-9가-힣._-]/g, '')}`;
        const filePath = `gallery/${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from('magic-frame')
            .upload(filePath, buffer, { contentType: 'image/jpeg', upsert: false });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: urlData } = supabase.storage.from('magic-frame').getPublicUrl(filePath);

        return NextResponse.json({ success: true, url: urlData.publicUrl, name: safeName });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE: 이미지 삭제 (관리자 전용)
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!isAdmin(session?.user?.email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const names: string[] = body.names || (body.name ? [body.name] : []);
        if (names.length === 0) {
            return NextResponse.json({ error: '파일명이 필요합니다.' }, { status: 400 });
        }

        const paths = names.map(n => `gallery/${n}`);
        const { error } = await supabase.storage
            .from('magic-frame')
            .remove(paths);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
