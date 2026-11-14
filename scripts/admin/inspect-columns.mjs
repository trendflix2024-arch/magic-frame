// magic_frame_users 의 모든 컬럼 + 샘플 row 확인
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const URL = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/)[1];
const KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\n]+)"?/)[1];
const supabase = createClient(URL, KEY);

// submitted=true 인 샘플 1건
const { data: submitted } = await supabase
    .from('magic_frame_users')
    .select('*')
    .eq('submitted', true)
    .order('updated_at', { ascending: false })
    .limit(1);

console.log('=== submitted=true 샘플 ===');
console.log(submitted?.[0]);
console.log('\n컬럼들:', Object.keys(submitted?.[0] ?? {}).sort().join(', '));
