import { createClient } from '@supabase/supabase-js';

// CRITICAL: .trim() strips trailing \r\n that Vercel sometimes injects into env vars
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    console.warn('[LeafNote] Supabase credentials missing or placeholder. Cloud sync DISABLED.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

// Service role client — bypasses RLS, server-side only
export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceRoleKey || supabaseAnonKey || 'placeholder',
    { auth: { autoRefreshToken: false, persistSession: false } }
);
