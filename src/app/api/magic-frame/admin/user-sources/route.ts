import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const SOURCES_PATH = 'user-sources.json';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin.storage.from('magic-frame').download(SOURCES_PATH);
        if (!data || error) return NextResponse.json({ sources: {} });
        const sources: Record<string, string> = JSON.parse(await data.text());
        return NextResponse.json({ sources });
    } catch {
        return NextResponse.json({ sources: {} });
    }
}
