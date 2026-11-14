import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseServiceKey) {
    console.warn('[LeafNote] SUPABASE_SERVICE_ROLE_KEY missing. Server-side storage operations will fail.');
}

// Next 14 는 서버의 fetch 결과를 기본으로 캐시한다. user-sources.json 처럼 읽고-고쳐-쓰는 파일이
// 캐시된 옛 내용으로 읽히면 기록이 사라지므로, 서비스 키 클라이언트는 항상 캐시 없이 요청한다.
export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceKey || 'placeholder',
    { global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) } }
);
