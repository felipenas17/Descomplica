import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validar se o Supabase está configurado corretamente
// Impede chamadas silenciosas que falham por falta de envs
export const isSupabaseConfigured = Boolean(
  rawUrl && 
  supabaseAnonKey && 
  rawUrl.startsWith('https://') && 
  supabaseAnonKey.length > 20
);

const supabaseUrl = rawUrl.replace(/\/$/, '').replace(/\/rest\/v1$/, '');

if (rawUrl.includes('/rest/v1')) {
  console.warn('⚠️ AVISO: Sua URL do Supabase no .env contém "/rest/v1". Remova isso! Use apenas o domínio base (ex: https://abc.supabase.co).');
}

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.error('❌ Supabase não está configurado adequadamente. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
