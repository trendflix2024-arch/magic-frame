// 최근 30분 내 업로드된 사용자 추적
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const URL = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/)[1];
const KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\n]+)"?/)[1];
const supabase = createClient(URL, KEY);

const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
const { data } = await supabase
    .from('magic_frame_users')
    .select('id, name, phone, haengbun, submitted, image_url, image_type, updated_at')
    .gte('updated_at', since)
    .order('updated_at', { ascending: false })
    .limit(20);

console.log(`최근 30분 updated_at: ${data?.length ?? 0} rows`);
for (const u of data ?? []) {
    const v = u.image_url?.match(/\?v=(\d+)/)?.[1];
    const vDate = v ? new Date(parseInt(v)).toISOString() : 'N/A';
    console.log(`${u.updated_at} | submitted=${u.submitted} | type=${u.image_type} | name=${u.name} | hb=${u.haengbun} | img_v=${vDate}`);
}
