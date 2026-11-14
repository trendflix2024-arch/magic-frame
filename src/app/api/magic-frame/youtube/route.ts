import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// 관리자 화면에서 바꾼 영상 목록이 바로 보이도록 빌드 시점 정적 캐시를 끈다.
export const dynamic = 'force-dynamic';

const VIDEOS_PATH = 'youtube-videos.json';

export async function GET() {
    try {
        const { data } = await supabaseAdmin.storage.from('magic-frame').download(VIDEOS_PATH);
        if (!data) return NextResponse.json({ videos: [] });
        const parsed = JSON.parse(await data.text());
        return NextResponse.json({ videos: Array.isArray(parsed) ? parsed : [] });
    } catch {
        return NextResponse.json({ videos: [] });
    }
}
