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

// Se o usuário receber erro de "api.supabase.com", provavelmente é erro de rede ou URL configurada errada como api.supabase.com em vez da URL do projeto
if (typeof window !== 'undefined' && supabaseUrl.includes('api.supabase.com')) {
  console.error('🚨 ERRO CRÍTICO: Sua URL do Supabase aponta para api.supabase.com. Use a URL do projeto (ex: https://xyz.supabase.co)!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
