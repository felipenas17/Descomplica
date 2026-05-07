import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/$/, '').replace(/\/rest\/v1$/, '');

if (rawUrl.includes('/rest/v1')) {
  console.warn('⚠️ AVISO: Sua URL do Supabase no .env contém "/rest/v1". Remova isso! Use apenas o domínio base (ex: https://abc.supabase.co).');
}

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
