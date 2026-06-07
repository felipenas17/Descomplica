'use client';

import React, { useState } from 'react';
import { LogIn, User, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ForgotPasswordModal from './modals/ForgotPasswordModal';

interface LoginProps {
  onLogin: (user: { 
    role: 'admin' | 'professor', 
    name: string, 
    id?: string, 
    email?: string, 
    needs_password_change?: boolean 
  }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'professor'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      console.log('[Login] Tentativa de login:', cleanEmail);

      // Demo removido por segurança
      if (false) {
        onLogin({
          role: role,
          name: role === 'admin' ? 'Coordenador Demo' : 'Prof. Demo'
        });
        return;
      }

      if (!isSupabaseConfigured) {
        console.error('[Login] Tentativa de login via Supabase falhou: Configuração ausente.');
        throw new Error('Supabase não configurado. Por favor, utilize o botão "Acesso Demo" ou configure as variáveis de ambiente.');
      }

      if (isRegistering) {
        console.log('[Login] Registrando novo usuário:', cleanEmail);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            emailRedirectTo: undefined,
            data: {
              full_name: name,
              role: role,
              needs_password_change: false
            }
          }
        });

        if (signUpError) {
          console.error('[Login] Erro no Registro:', signUpError);
          throw signUpError;
        }
        
        if (data.user) {
          console.log('[Login] Sincronizando perfil do novo usuário...');
          const { error: profileSyncError } = await supabase.from('profiles').upsert([{
            id: data.user.id,
            email: cleanEmail,
            full_name: name,
            role: role,
            needs_password_change: false
          }]);
          
          if (profileSyncError) console.warn('[Login] Aviso: Falha ao sincronizar perfil:', profileSyncError);

          // Tentativa de login automático imediato
          console.log('[Login] Tentando login automático após registro...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword
          });

          if (!signInError && signInData.user) {
            console.log('[Login] Login automático bem-sucedido.');
            onLogin({
              id: signInData.user.id,
              email: signInData.user.email,
              role: (signInData.user.user_metadata?.role as any) || role,
              name: signInData.user.user_metadata?.full_name || name,
              needs_password_change: false
            });
            return;
          }
        }

        console.log('[Login] Registro concluído.');
        alert('Cadastro realizado! Por favor, verifique seu e-mail ou tente entrar.');
        setIsRegistering(false);
      } else {
        console.log('[Login] Autenticando via Supabase...');
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });

        if (signInError) {
          console.error('[Login] Erro no Supabase Auth:', JSON.stringify(signInError, null, 2));
          throw signInError;
        }

        if (!data.user) throw new Error('Usuário não encontrado após autenticação.');

        console.log('[Login] Autenticação bem-sucedida, buscando perfil...');
        
        // Buscar perfil para obter role e outros metadados
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          console.warn('[Login] Perfil não encontrado no banco. Usando metadados do Auth.');
          onLogin({
            id: data.user.id,
            email: data.user.email,
            role: (data.user.user_metadata?.role as any) || 'admin',
            name: data.user.user_metadata?.full_name || 'Usuário',
            needs_password_change: data.user.user_metadata?.needs_password_change || false
          });
        } else {
          console.log('[Login] Perfil carregado:', profile.role);
          let loginId = profile.id;
          if (profile.role === 'professor') {
            const { data: tData } = await supabase.from('teachers').select('id').eq('email', profile.email).single();
            if (tData) { loginId = tData.id; console.log('[Login] teacher_id:', tData.id); }
            else { console.log('[Login] teacher nao encontrado para email:', profile.email); }
          }
          onLogin({
            id: loginId,
            profile_id: profile.id,
            email: profile.email,
            role: profile.role,
            name: profile.full_name || 'Usuário',
            needs_password_change: profile.needs_password_change || false
          });
        }
      }
    } catch (err: any) {
      console.error('[Login] Erro fatal:', err);
      let message = err.message || 'Erro na autenticação';
      
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('invalid login credentials')) {
        message = 'E-mail ou senha incorretos. Verifique suas credenciais.';
      } else if (lowerMsg.includes('email not confirmed')) {
        message = 'Verifique seu e-mail ou entre em contato com o suporte para confirmar sua conta.';
      } else if (lowerMsg.includes('rate limit exceeded')) {
        message = 'Muitas tentativas. Por favor, aguarde alguns minutos ou use o modo demonstração.';
      } else if (lowerMsg.includes('not configured')) {
        // Mensagem já definida acima
      } else {
        message = `Erro: ${message}`;
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-app flex items-center justify-center p-6 selection:bg-primary/30 selection:text-primary">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6 animate-pulse">
             <motion.div
               animate={{ rotate: [0, 10, -10, 0] }}
               transition={{ repeat: Infinity, duration: 4 }}
             >
               <LogIn size={40} />
             </motion.div>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-primary">
            {isRegistering ? 'Criar Conta' : 'Gestão de Escolas'}
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium uppercase tracking-widest">
            {isRegistering ? 'Cadastre-se na plataforma' : 'Painel Administrativo v1.0.4'}
          </p>
        </div>

        <div className="flex p-1.5 bg-primary/5 rounded-2xl mb-8">
          <button
            onClick={() => setRole('admin')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${role === 'admin' ? 'bg-white shadow-lg text-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Administrador
          </button>
          <button
            onClick={() => setRole('professor')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${role === 'professor' ? 'bg-white shadow-lg text-secondary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Professor
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[11px] font-bold"
            >
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <Lock size={14} />
              </div>
              <p>{error}</p>
            </motion.div>
          )}

          {isRegistering && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Seu nome"
                  className="w-full bg-white/50 border-2 border-primary/5 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm outline-none font-medium"
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">E-mail ou Usuário</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors text-gray-400">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full bg-white/50 border-2 border-primary/5 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm outline-none font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="sua senha"
                className="w-full bg-white/50 border-2 border-primary/5 rounded-2xl py-4 pl-12 pr-12 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-5 rounded-2xl font-extrabold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
              role === 'admin' 
                ? 'bg-primary text-white shadow-primary/30 hover:shadow-primary/40' 
                : 'bg-secondary text-black shadow-secondary/30 hover:shadow-secondary/40'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>{isRegistering ? 'Cadastrar Agora' : 'Entrar no Sistema'} <LogIn size={20} /></>
            )}
          </button>


        </form>

        <div className="mt-8 pt-8 border-t border-primary/5 flex flex-col items-center gap-4">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm font-bold text-primary hover:underline underline-offset-4"
          >
            {isRegistering ? 'Já tenho uma conta? Fazer login' : 'Não tem conta? Cadastre-se aqui'}
          </button>
          
          <button
            onClick={() => setIsForgotPasswordOpen(true)}
            className="text-xs text-gray-400 font-medium italic hover:text-primary transition-colors"
          >
            Esqueceu seus dados? <span className="text-primary font-bold not-italic font-sans underline underline-offset-2">Clique aqui</span>
          </button>
          
          <div className="w-full pt-4 space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-gray-200"></div>
              <span className="relative px-4 bg-white text-[10px] font-black text-gray-400 uppercase tracking-widest">Painel v1.0.4</span>
            </div>
          </div>
        </div>
      </motion.div>

      <ForgotPasswordModal 
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}

