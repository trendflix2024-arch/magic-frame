import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseServiceKey) {
    console.warn('[LeafNote] SUPABASE_SERVICE_ROLE_KEY missing. Server-side storage operations will fail.');
}

// Next 14 는 서버의 fetch 결과를 기본으로 캐시한다. youtube-videos.json 같은 Storage 파일이나
// 테이블 조회가 캐시된 옛 내용으로 읽히지 않도록, 서비스 키 클라이언트는 항상 캐시 없이 요청한다.
export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceKey || 'placeholder',
    { global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) } }
);
