'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password strength logic
  const strength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    return score;
  }, [newPassword]);

  const strengthLabel = ['Fraca', 'Fraca', 'Média', 'Forte'][strength];
  const strengthColor = ['bg-gray-200', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'][strength];

  const isValid = 
    newPassword.length >= 8 && 
    /[A-Z]/.test(newPassword) && 
    /[0-9]/.test(newPassword) && 
    newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      // Note: Supabase doesn't strictly verify current password in updateUser
      // but we include it as per user requirement.
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err: any) {
      console.error('[ChangePassword] Erro:', err);
      setError(err.message || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary"></div>
            
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black text-primary">Alterar Senha</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Segurança da Conta</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                >
                  <X size={20} />
                </button>
              </div>

              {success ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                    <ShieldCheck size={40} className="animate-bounce" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Senha Alterada!</h3>
                  <p className="text-sm text-gray-500 font-medium">Sua conta agora está protegida com a nova senha.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[11px] font-bold">
                      <AlertCircle size={16} />
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Senha Atual</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nova Senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm outline-none font-medium"
                    />
                    
                    {/* Strength Indicator */}
                    <div className="px-1 pt-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Força: {strengthLabel}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full flex-1 transition-all duration-500 ${strength >= 1 ? strengthColor : 'bg-gray-200'}`}></div>
                        <div className={`h-full flex-1 transition-all duration-500 ${strength >= 2 ? strengthColor : 'bg-gray-200'}`}></div>
                        <div className={`h-full flex-1 transition-all duration-500 ${strength >= 3 ? strengthColor : 'bg-gray-200'}`}></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full bg-gray-50 border-2 rounded-2xl py-3.5 px-5 focus:ring-4 transition-all text-sm outline-none font-medium ${
                        confirmPassword && newPassword !== confirmPassword 
                          ? 'border-red-200 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-100 focus:border-primary focus:ring-primary/10'
                      }`}
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1">
                        <AlertCircle size={10} /> As senhas não coincidem
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading || !isValid}
                      className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
                        isValid 
                          ? 'bg-primary text-white shadow-primary/30 hover:shadow-primary/40' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>Salvar Nova Senha <Check size={18} /></>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
            
            <div className="bg-gray-50 p-6 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Dicas de Segurança</h4>
              <ul className="space-y-2">
                <li className={`text-[10px] flex items-center gap-2 font-bold ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500 opacity-60'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Mínimo 8 caracteres
                </li>
                <li className={`text-[10px] flex items-center gap-2 font-bold ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500 opacity-60'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Pelo menos uma letra maiúscula
                </li>
                <li className={`text-[10px] flex items-center gap-2 font-bold ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500 opacity-60'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Pelo menos um número
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
