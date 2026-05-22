'use client';

import React, { useState } from 'react';
import { X, User, Mail, Briefcase, Calendar, Key, Copy, Check, Phone, Hash, MapPin, CreditCard, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface TeacherFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function TeacherForm({ onClose, onSubmit }: TeacherFormProps) {
  const [generatedPassword] = useState(() => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) password += charset.charAt(Math.floor(Math.random() * charset.length));
    return password;
  });
  const [copied, setCopied] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [daySchedules, setDaySchedules] = useState<Record<string, { start: string; end: string }>>({});
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', formation: '', phone: '', cpf: '',
    age: '', sex: '', payment_method: '', pix_key: '',
    address: '', neighborhood: '', city: '', cep: '',
  });

  const update = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  const toggleDay = (day: string) => {
    setSelectedDays(prev => {
      const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      if (!prev.includes(day)) setDaySchedules(ds => ({ ...ds, [day]: { start: '08:00', end: '09:00' } }));
      else setDaySchedules(ds => { const n = { ...ds }; delete n[day]; return n; });
      return next;
    });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      password: generatedPassword,
      age: formData.age ? parseInt(formData.age) : null,
      availability_schedule: JSON.stringify(daySchedules),
      availability: selectedDays.join(', '),
    });
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all";
  const labelClass = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-3xl p-6 border-b border-gray-100 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-black text-purple-600">Novo Professor</h2>
            <p className="text-gray-400 text-sm mt-0.5">Cadastre um novo professor no sistema.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* SEÇÃO 1: Dados Básicos */}
          <div>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={12} /> Dados Básicos
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome Completo *</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.name} onChange={e => update('name', e.target.value)} required className={inputClass} placeholder="Ex: Ricardo Santos" />
                </div>
              </div>
              <div>
                <label className={labelClass}>E-mail *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="email" value={formData.email} onChange={e => update('email', e.target.value)} required className={inputClass} placeholder="professor@email.com" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.phone} onChange={e => update('phone', e.target.value)} className={inputClass} placeholder="(22) 99999-9999" />
                </div>
              </div>
              <div>
                <label className={labelClass}>CPF</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.cpf} onChange={e => update('cpf', e.target.value)} className={inputClass} placeholder="000.000.000-00" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Idade</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="number" value={formData.age} onChange={e => update('age', e.target.value)} className={inputClass} placeholder="Ex: 30" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Sexo</label>
                <div className="flex gap-2">
                  {[{ value: 'M', label: '♂ Masc.' }, { value: 'F', label: '♀ Fem.' }].map(opt => (
                    <button type="button" key={opt.value} onClick={() => update('sex', opt.value)}
                      className={`flex-1 p-3 rounded-2xl border-2 transition-all text-center text-xs font-bold ${formData.sex === opt.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: Formação e Atuação */}
          <div>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Briefcase size={12} /> Formação e Atuação
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Formação Acadêmica</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.formation} onChange={e => update('formation', e.target.value)} className={inputClass} placeholder="Ex: Licenciatura em Matemática" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Disciplinas que Leciona *</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.subject} onChange={e => update('subject', e.target.value)} required className={inputClass} placeholder="Ex: Matemática, Física" />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: Disponibilidade */}
          <div>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={12} /> Disponibilidade
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {DAYS_OF_WEEK.map(day => (
                <button type="button" key={day} onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedDays.includes(day) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            {selectedDays.length > 0 && (
              <div className="space-y-2">
                {selectedDays.map(day => (
                  <div key={day} className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-2">
                    <span className="text-xs font-black text-purple-700 w-12">{day.slice(0, 3)}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <Clock size={14} className="text-purple-400" />
                      <input type="time" value={daySchedules[day]?.start || '08:00'}
                        onChange={e => setDaySchedules(ds => ({ ...ds, [day]: { ...ds[day], start: e.target.value } }))}
                        className="bg-white border border-purple-200 rounded-lg py-1 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
                      <span className="text-xs text-gray-400">até</span>
                      <input type="time" value={daySchedules[day]?.end || '09:00'}
                        onChange={e => setDaySchedules(ds => ({ ...ds, [day]: { ...ds[day], end: e.target.value } }))}
                        className="bg-white border border-purple-200 rounded-lg py-1 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEÇÃO 4: Pagamento */}
          <div>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard size={12} /> Forma de Recebimento
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { value: 'pix', label: '💠 PIX' },
                { value: 'dinheiro', label: '💵 Dinheiro' },
                { value: 'transferencia', label: '🏦 Transferência' },
              ].map(opt => (
                <button type="button" key={opt.value} onClick={() => update('payment_method', opt.value)}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${formData.payment_method === opt.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {formData.payment_method === 'pix' && (
              <div>
                <label className={labelClass}>Chave PIX</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.pix_key} onChange={e => update('pix_key', e.target.value)} className={inputClass} placeholder="CPF, e-mail, telefone ou chave aleatória" />
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 5: Senha */}
          <div>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Key size={12} /> Acesso ao Sistema
            </p>
            <div>
              <label className={labelClass}>Senha Gerada Automaticamente</label>
              <div className="relative">
                <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-11 pr-12 text-sm font-mono font-bold text-gray-900 truncate">
                  {generatedPassword}
                </div>
                <button type="button" onClick={handleCopyPassword} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-700 transition-colors">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Copie e envie para o professor. O acesso é automático.</p>
            </div>
          </div>

          {/* SEÇÃO 6: Endereço (expansível) */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button type="button" onClick={() => setShowExtra(!showExtra)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} /> Endereço
              </span>
              {showExtra ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {showExtra && (
              <div className="p-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>Rua / Avenida</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input value={formData.address} onChange={e => update('address', e.target.value)} className={inputClass} placeholder="Rua, número..." />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Bairro</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input value={formData.neighborhood} onChange={e => update('neighborhood', e.target.value)} className={inputClass} placeholder="Bairro" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Cidade</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input value={formData.city} onChange={e => update('city', e.target.value)} className={inputClass} placeholder="Cidade" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>CEP</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input value={formData.cep} onChange={e => update('cep', e.target.value)} className={inputClass} placeholder="00000-000" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-sm hover:bg-gray-50 transition-all text-gray-600">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all">
              Salvar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
