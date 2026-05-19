'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, Camera, Check, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUserUpdate: (updated: any) => void;
}

export default function UserProfileModal({ isOpen, onClose, user, onUserUpdate }: Props) {
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error } = await supabase.storage.from('materials').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('materials').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch (e: any) {
      setProfileError('Erro ao enviar foto: ' + e.message);
    } finally { setUploading(false); }
  };

  const saveProfile = async () => {
    if (!name.trim()) return;
    setSavingProfile(true);
    setProfileError('');
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: name.trim(),
        avatar_url: avatarUrl,
      }).eq('id', user.id);
      if (error) throw error;
      onUserUpdate({ ...user, name: name.trim(), avatar_url: avatarUrl });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (e: any) {
      setProfileError(e.message);
    } finally { setSavingProfile(false); }
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword || newPassword.length < 8) return;
    setSavingPassword(true);
    setPasswordError('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (e: any) {
      setPasswordError(e.message);
    } finally { setSavingPassword(false); }
  };

  const initials = (name || user?.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">

            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 to-purple-400" />

            {/* Header */}
            <div className="p-8 pb-0">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Meu Perfil</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configurações da Conta</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-black overflow-hidden ring-4 ring-purple-100">
                    {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <button onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all">
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
                </div>
                <p className="text-sm font-bold text-gray-700 mt-3">{user?.name}</p>
                <p className="text-xs text-purple-500 uppercase font-bold">{user?.role}</p>
              </div>

              {/* Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
                {(['profile', 'password'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${tab === t ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    {t === 'profile' ? '👤 Perfil' : '🔒 Senha'}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-8 pb-8">
              {tab === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Nome Completo</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all text-sm outline-none font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Email</label>
                    <input type="text" value={user?.email || ''} disabled
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 px-5 text-sm font-medium text-gray-400 cursor-not-allowed" />
                  </div>

                  {profileError && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12} />{profileError}</p>}
                  {profileSuccess && <p className="text-xs text-green-600 font-bold flex items-center gap-1"><Check size={12} /> Perfil atualizado!</p>}

                  <button onClick={saveProfile} disabled={savingProfile || !name.trim()}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all mt-2">
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {savingProfile ? 'Salvando...' : 'Salvar Perfil'}
                  </button>
                </div>
              )}

              {tab === 'password' && (
                <div className="space-y-4">
                  {['Senha Atual', 'Nova Senha', 'Confirmar Senha'].map((label, i) => (
                    <div key={label}>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
                      <input type="password" placeholder="••••••••"
                        value={i === 0 ? currentPassword : i === 1 ? newPassword : confirmPassword}
                        onChange={e => i === 0 ? setCurrentPassword(e.target.value) : i === 1 ? setNewPassword(e.target.value) : setConfirmPassword(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all text-sm outline-none font-medium" />
                    </div>
                  ))}

                  {passwordError && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12} />{passwordError}</p>}
                  {passwordSuccess && (
                    <p className="text-xs text-green-600 font-bold flex items-center gap-1"><ShieldCheck size={12} /> Senha alterada com sucesso!</p>
                  )}

                  <button onClick={savePassword} disabled={savingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all">
                    {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                    {savingPassword ? 'Salvando...' : 'Alterar Senha'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
