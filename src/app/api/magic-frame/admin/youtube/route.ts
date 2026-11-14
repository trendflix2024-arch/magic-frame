import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminAuth } from '@/lib/admin-auth';

const VIDEOS_PATH = 'youtube-videos.json';

async function loadVideos(): Promise<string[]> {
    try {
        const { data } = await supabaseAdmin.storage.from('magic-frame').download(VIDEOS_PATH);
        if (!data) return [];
        const parsed = JSON.parse(await data.text());
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function saveVideos(videos: string[]) {
    await supabaseAdmin.storage.from('magic-frame').upload(
        VIDEOS_PATH,
        Buffer.from(JSON.stringify(videos)),
        { contentType: 'application/json', upsert: true }
    );
}

export async function GET(req: NextRequest) {
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const videos = await loadVideos();
    return NextResponse.json({ videos });
}

export async function POST(req: NextRequest) {
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    try {
        const { videos } = await req.json();
        if (!Array.isArray(videos)) {
            return NextResponse.json({ error: '잘못된 형식입니다.' }, { status: 400 });
        }
        const cleaned = videos.map((v: string) => String(v).trim()).filter(Boolean);
        await saveVideos(cleaned);
        return NextResponse.json({ success: true, videos: cleaned });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
