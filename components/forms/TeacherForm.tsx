'use client';

import React, { useState } from 'react';
import { X, User, Mail, Briefcase, Calendar, Key, Copy, Check } from 'lucide-react';

interface TeacherFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function TeacherForm({ onClose, onSubmit }: TeacherFormProps) {
  const [generatedPassword] = useState(() => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  });
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    onSubmit({ ...data, password: generatedPassword });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-display font-extrabold text-primary">Novo Professor</h2>
            <p className="text-gray-500 mt-1">Preencha os dados do docente.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Nome Completo</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
                <input name="name" required className="w-full bg-primary/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all" placeholder="Ex: Ricardo Santos" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">E-mail Institucional</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
                <input name="email" type="email" required className="w-full bg-primary/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all" placeholder="ricardo@escola.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Matéria / Disciplina</label>
              <div className="relative">
                <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
                <input name="subject" required className="w-full bg-primary/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all" placeholder="Ex: Matemática Avançada" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Senha de Acesso Gerada</label>
              <div className="relative">
                <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
                <div className="w-full bg-secondary/10 border-2 border-secondary/20 rounded-2xl py-4 pl-12 pr-12 text-sm font-mono font-bold text-gray-900 overflow-hidden truncate">
                  {generatedPassword}
                </div>
                <button 
                  type="button"
                  onClick={handleCopyPassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark transition-colors"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-bold ml-2">Copie e envie para o professor. O acesso é automático.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Disponibilidade</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
                <input name="availability" className="w-full bg-primary/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all" placeholder="Ex: SEG, TER, QUA" />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-primary/10 font-bold hover:bg-gray-50 transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Salvar Registro</button>
          </div>
        </form>
      </div>
    </div>
  );
}
