import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminAuth } from '@/lib/admin-auth';

// 요청 없이 GET 하면 Next 가 빌드 시점 결과를 정적으로 캐시해 새 고객의 출처가 안 보인다.
export const dynamic = 'force-dynamic';

const SOURCES_PATH = 'user-sources.json';

export async function GET(req: NextRequest) {
    if (!await checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    try {
        const { data, error } = await supabaseAdmin.storage.from('magic-frame').download(SOURCES_PATH);
        if (!data || error) return NextResponse.json({ sources: {} });
        const sources: Record<string, string> = JSON.parse(await data.text());
        return NextResponse.json({ sources });
    } catch {
        return NextResponse.json({ sources: {} });
    }
}
