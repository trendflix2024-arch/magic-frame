// 최근 등록 고객 조사 — 삭제 전 안전성 검토
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const URL = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/)[1];
const KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\n]+)"?/)[1];

const supabase = createClient(URL, KEY);

// 1. 전체 카운트
const { count: total } = await supabase
    .from('magic_frame_users')
    .select('id', { count: 'exact', head: true });

// 2. 오늘 신규 (한국시간 기준 자정)
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
const { count: todayNew } = await supabase
    .from('magic_frame_users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString());

// 3. 오늘 신규 중 shipping_status별 분포
const statuses = ['pending', 'new_order', 'preparing', 'shipped'];
const statusCounts = {};
for (const s of statuses) {
    const { count } = await supabase
        .from('magic_frame_users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())
        .eq('shipping_status', s);
    statusCounts[s] = count || 0;
}

// 4. 오늘 신규 중 submitted=true (사진 제출 완료)
const { count: submittedToday } = await supabase
    .from('magic_frame_users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
    .eq('submitted', true);

// 5. 오늘 신규 중 image_url IS NOT NULL
const { count: hasImageToday } = await supabase
    .from('magic_frame_users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
    .not('image_url', 'is', null);

// 6. 가장 오래된 오늘 등록 고객 / 가장 최신 (생성 시각 범위)
const { data: oldestToday } = await supabase
    .from('magic_frame_users')
    .select('created_at, name, haengbun')
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: true })
    .limit(1);
const { data: newestToday } = await supabase
    .from('magic_frame_users')
    .select('created_at, name, haengbun')
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

// 7. 행번 중복 카운트 (전체)
const { data: allUsers } = await supabase
    .from('magic_frame_users')
    .select('haengbun')
    .gte('created_at', todayStart.toISOString());
const counts = new Map();
for (const u of allUsers || []) {
    if (!u.haengbun) continue;
    counts.set(u.haengbun, (counts.get(u.haengbun) || 0) + 1);
}
let dupRows = 0;
let dupKeys = 0;
for (const c of counts.values()) {
    if (c > 1) {
        dupKeys++;
        dupRows += c;
    }
}

console.log('═══ DB 상태 조사 ═══');
console.log(`전체 고객: ${total}`);
console.log(`오늘 신규: ${todayNew}`);
console.log('');
console.log('── 오늘 신규 분포 ──');
console.log(`pending (대기):     ${statusCounts.pending}`);
console.log(`new_order (제작중): ${statusCounts.new_order}`);
console.log(`preparing (준비):   ${statusCounts.preparing}`);
console.log(`shipped (발송완료): ${statusCounts.shipped}`);
console.log('');
console.log(`사진 제출 완료(submitted=true): ${submittedToday}`);
console.log(`이미지 업로드됨(image_url):     ${hasImageToday}`);
console.log('');
console.log('── 시간 범위 ──');
console.log(`최초: ${oldestToday?.[0]?.created_at} (${oldestToday?.[0]?.name}, ${oldestToday?.[0]?.haengbun})`);
console.log(`최신: ${newestToday?.[0]?.created_at} (${newestToday?.[0]?.name}, ${newestToday?.[0]?.haengbun})`);
console.log('');
console.log('── 오늘 신규 중 행번 중복 ──');
console.log(`중복된 행번 종류:   ${dupKeys}`);
console.log(`중복으로 인한 행수: ${dupRows}`);
