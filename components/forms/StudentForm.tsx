'use client';

import React from 'react';
import { X, User, Mail, Hash, Shapes } from 'lucide-react';

interface StudentFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function StudentForm({ onClose, onSubmit }: StudentFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-display font-extrabold text-secondary">Matrícula de Aluno</h2>
            <p className="text-gray-500 mt-1">Inscreva um novo aluno no sistema.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Nome do Aluno</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" />
                <input name="name" required className="w-full bg-secondary/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all" placeholder="Ex: Ana Silva" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" />
                <input name="email" type="email" required className="w-full bg-secondary/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all" placeholder="ana@exemplo.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Nº Matrícula</label>
              <div className="relative">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" />
                <input name="registration" required className="w-full bg-secondary/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all" placeholder="Ex: #4502" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Turma / Classe</label>
              <div className="relative">
                <Shapes size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" />
                <input name="class" required className="w-full bg-secondary/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all" placeholder="Ex: 3º Ano B" />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-secondary/10 font-bold hover:bg-gray-50 transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-secondary text-black py-4 rounded-2xl font-bold shadow-xl shadow-secondary/20 hover:scale-105 active:scale-95 transition-all">Efetivar Matrícula</button>
          </div>
        </form>
      </div>
    </div>
  );
}
