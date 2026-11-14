import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
