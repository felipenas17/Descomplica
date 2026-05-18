'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AlertCircle, CheckCircle2, RefreshCw, Settings, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function SupabaseDebug() {
  const [isMounted, setIsMounted] = useState(false);
  const [status, setStatus] = useState<{
    loading: boolean;
    error: string | null;
    tables: string[];
    configOk: boolean;
  }>({
    loading: true,
    error: null,
    tables: [],
    configOk: isSupabaseConfigured,
  });

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    if (!isSupabaseConfigured) {
      setStatus({
        loading: false,
        error: 'Variáveis de ambiente do Supabase não configuradas.',
        tables: [],
        configOk: false,
      });
      return;
    }

    try {
      // Testar conexão buscando uma tabela básica
      // Usamos 'profiles' como teste principal
      const { error: supabaseError } = await supabase.from('profiles').select('id', { count: 'exact' }).limit(1);
      
      if (supabaseError) {
        // Se a tabela 'profiles' não existir, tentamos 'students' para ver se é só um problema de schema incompleto
        const { error: secondTryError } = await supabase.from('students').select('id').limit(1);
        
        if (secondTryError) {
           throw supabaseError; // Se ambos falharem, o problema é mais profundo (conexão/config)
        }
        
        setStatus({
          loading: false,
          error: 'A tabela "profiles" não foi encontrada. Copie o conteúdo do arquivo "supabase_schema.sql" (na raiz do projeto) e cole no SQL Editor do Supabase para criar as tabelas necessárias.',
          tables: ['students'],
          configOk: true,
        });
        return;
      }

      setStatus({
        loading: false,
        error: null,
        tables: ['profiles'],
        configOk: true,
      });
    } catch (err: any) {
      console.error('[SupabaseDebug] Erro detalhado da conexão:', err);
      
      let errorMessage = 'Erro desconhecido ao conectar ao Supabase.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error_description) {
        errorMessage = err.error_description;
      } else if (err.code) {
        errorMessage = `Erro ${err.code}: ${err.details || err.hint || JSON.stringify(err)}`;
      } else if (typeof err === 'object') {
        // Tentar extrair algo de objetos de erro complexos
        errorMessage = err.message || JSON.stringify(err, Object.getOwnPropertyNames(err));
      }

      // Se o erro for uma string vazia ou objeto vazio
      if (errorMessage === '{}' || !errorMessage) {
        errorMessage = 'Falha na requisição (CORS ou URL inválida). Verifique se o projeto Supabase está ativo e as URLs no .env estão corretas.';
      }

      setStatus({
        loading: false,
        error: errorMessage,
        tables: [],
        configOk: true,
      });
    }
  };

  useEffect(() => {
    setIsMounted(true);
    checkConnection();
  }, []);

  if (!isMounted) return null;

  if (!status.configOk && !status.error) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-[2rem] border mb-8 flex flex-col md:flex-row items-center justify-between gap-6 ${
        status.error 
          ? 'bg-red-50 border-red-100 text-red-800' 
          : 'bg-emerald-50 border-emerald-100 text-emerald-800'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          status.error ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {status.loading ? <RefreshCw className="animate-spin" size={24} /> : 
           status.error ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
        </div>
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest">
            Status do Supabase
          </h3>
          <p className="text-xs font-bold opacity-80 mt-1">
            {status.loading ? 'Verificando conexão...' : 
             status.error ? `Erro: ${status.error}` : 'Conexão estabelecida com sucesso!'}
          </p>
          {status.error?.includes('api.supabase.com') && (
            <p className="text-[10px] font-black text-red-500 mt-2 uppercase flex items-center gap-1">
              <Settings size={10} /> Dica: Verifique se sua URL no .env não inclui "api.supabase.com"
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <button 
          onClick={checkConnection}
          className="flex-1 md:flex-none px-6 py-3 bg-white/50 hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          Re-testar
        </button>
        <a 
          href="https://supabase.com/dashboard" 
          target="_blank" 
          className="flex-1 md:flex-none px-6 py-3 bg-white/50 hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          Dashboard <ExternalLink size={12} />
        </a>
      </div>
    </motion.div>
  );
}
