'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, User, Mail, Hash, Shapes, Phone, Calendar, School, Users, Clock, BookOpen, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface StudentFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function StudentForm({ onClose, onSubmit }: StudentFormProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showExtra, setShowExtra] = useState(false);
  const [formData, setFormData] = useState({
    // Básico
    name: '',
    email: '',
    registration: '',
    class: '',
    // Contato
    phone: '',
    parent_name: '',
    parent_phone: '',
    // Perfil
    age: '',
    birth_date: '',
    school: '',
    grade: '',
    // Aulas
    lesson_type: 'individual',
    frequency: '',
    lesson_duration: '60',
    preferred_time: '',
    lesson_start_time: '08:00',
    lesson_end_time: '09:00',
    recurrence_start: new Date().toISOString().split('T')[0],
    recurrence_end: '',
    // Extra
    notes: '',
    address: '',
    how_found: '',
  });

  const update = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentData = {
      ...formData,
      days_of_week: selectedDays.join(', '),
    };
    onSubmit(studentData);

    // Fecha se não tiver recorrência configurada
    if (!(selectedDays.length > 0 && formData.recurrence_start && formData.recurrence_end)) {
      onClose();
    }

    // Gera aulas recorrentes se tiver dias e datas configurados
    if (selectedDays.length > 0 && formData.recurrence_start && formData.recurrence_end && formData.lesson_start_time) {
      const dayMap: Record<string, number> = {
        'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6
      };
      const start = new Date(formData.recurrence_start + 'T00:00:00');
      const end = new Date(formData.recurrence_end + 'T00:00:00');
      const schedulesToCreate = [];
      const current = new Date(start);

      while (current <= end) {
        const dayOfWeek = current.getDay();
        const matchesDay = selectedDays.some(d => dayMap[d] === dayOfWeek);
        if (matchesDay) {
          schedulesToCreate.push({
            date: current.toISOString().split('T')[0],
            start_time: formData.lesson_start_time,
            end_time: formData.lesson_end_time,
            subject: 'A definir',
            student_name: formData.name,
            status: 'confirmado',
            notes: 'Aula recorrente gerada automaticamente',
            created_at: new Date().toISOString(),
          });
        }
        current.setDate(current.getDate() + 1);
      }

      if (schedulesToCreate.length > 0) {
        await supabase.from('schedules').insert(schedulesToCreate);
        alert(schedulesToCreate.length + ' aulas geradas automaticamente! ✅');
      onClose();
      }
    }
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all";
  const selectClass = "w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all appearance-none";
  const labelClass = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl p-6 border-b border-gray-100 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-black text-purple-600">Matrícula de Aluno</h2>
            <p className="text-gray-400 text-sm mt-0.5">Inscreva um novo aluno no sistema.</p>
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
                <label className={labelClass}>Nome do Aluno *</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.name} onChange={e => update('name', e.target.value)} required className={inputClass} placeholder="Nome completo" />
                </div>
              </div>
              <div>
                <label className={labelClass}>E-mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="email" value={formData.email} onChange={e => update('email', e.target.value)} className={inputClass} placeholder="aluno@exemplo.com" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Nº Matrícula *</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.registration} onChange={e => update('registration', e.target.value)} required className={inputClass} placeholder="Ex: #4502" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Turma / Classe *</label>
                <div className="relative">
                  <Shapes size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.class} onChange={e => update('class', e.target.value)} required className={inputClass} placeholder="Ex: 3º Ano B" />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: Perfil do Aluno */}
          <div>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <School size={12} /> Perfil do Aluno
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Idade</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="number" min="1" max="100" value={formData.age} onChange={e => update('age', e.target.value)} className={inputClass} placeholder="Ex: 12" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Data de Nascimento</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="date" value={formData.birth_date} onChange={e => update('birth_date', e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Ano Escolar</label>
                <div className="relative">
                  <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.grade} onChange={e => update('grade', e.target.value)} className={inputClass} placeholder="Ex: 7º Ano" />
                </div>
              </div>
              <div className="md:col-span-3">
                <label className={labelClass}>Escola do Aluno</label>
                <div className="relative">
                  <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.school} onChange={e => update('school', e.target.value)} className={inputClass} placeholder="Nome da escola que frequenta" />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: Configuração das Aulas */}
          <div>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BookOpen size={12} /> Configuração das Aulas
            </p>

            {/* Tipo de Aula */}
            <div className="mb-4">
              <label className={labelClass}>Tipo de Aula</label>
              <div className="flex gap-2">
                {[
                  { value: 'individual', label: '👤 Individual', desc: 'Só o aluno' },
                  { value: 'dupla', label: '👥 Dupla', desc: '2 alunos' },
                  { value: 'grupo', label: '👨‍👩‍👧‍👦 Grupo', desc: '3+ alunos' },
                ].map(opt => (
                  <button type="button" key={opt.value}
                    onClick={() => update('lesson_type', opt.value)}
                    className={`flex-1 p-3 rounded-2xl border-2 transition-all text-center ${formData.lesson_type === opt.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="text-sm font-bold text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Dias da Semana */}
            <div className="mb-4">
              <label className={labelClass}>Dias da Semana</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button type="button" key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedDays.includes(day) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              {selectedDays.length > 0 && (
                <p className="text-xs text-purple-500 mt-2 font-semibold">{selectedDays.length}x por semana — {selectedDays.join(', ')}</p>
              )}
            </div>

            {/* Horário Fixo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>Horário de Início</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="time" value={formData.lesson_start_time} onChange={e => update('lesson_start_time', e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Horário de Término</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="time" value={formData.lesson_end_time} onChange={e => update('lesson_end_time', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Período de Recorrência */}
            <div className="mb-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Calendar size={12} /> Período de Recorrência
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Data de Início</label>
                  <input type="date" value={formData.recurrence_start} onChange={e => update('recurrence_start', e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className={labelClass}>Data de Término</label>
                  <input type="date" value={formData.recurrence_end} onChange={e => update('recurrence_end', e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              {selectedDays.length > 0 && formData.recurrence_start && formData.recurrence_end && (
                <p className="text-xs text-purple-600 font-bold mt-3">
                  ✅ As aulas serão geradas automaticamente toda(s) {selectedDays.join(', ')} das {formData.lesson_start_time} às {formData.lesson_end_time}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Duração da Aula</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <select value={formData.lesson_duration} onChange={e => update('lesson_duration', e.target.value)} className={selectClass}>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1h30</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Horário Preferido</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <select value={formData.preferred_time} onChange={e => update('preferred_time', e.target.value)} className={selectClass}>
                    <option value="">Sem preferência</option>
                    <option value="manha">Manhã (7h-12h)</option>
                    <option value="tarde">Tarde (12h-18h)</option>
                    <option value="noite">Noite (18h-22h)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: Contato */}
          <div>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Phone size={12} /> Contato
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Telefone do Aluno</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.phone} onChange={e => update('phone', e.target.value)} className={inputClass} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Nome do Responsável</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.parent_name} onChange={e => update('parent_name', e.target.value)} className={inputClass} placeholder="Nome do pai/mãe" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Telefone do Responsável</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.parent_phone} onChange={e => update('parent_phone', e.target.value)} className={inputClass} placeholder="(11) 99999-9999" />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 5: Informações Extras (expansível) */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button type="button" onClick={() => setShowExtra(!showExtra)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} /> Informações Adicionais
              </span>
              {showExtra ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {showExtra && (
              <div className="p-4 border-t border-gray-100 space-y-4">
                <div>
                  <label className={labelClass}>Endereço</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input value={formData.address} onChange={e => update('address', e.target.value)} className={inputClass} placeholder="Rua, número, bairro..." />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Como nos conheceu?</label>
                  <div className="relative">
                    <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <select value={formData.how_found} onChange={e => update('how_found', e.target.value)} className={selectClass}>
                      <option value="">Selecione...</option>
                      <option value="indicacao">Indicação de amigo</option>
                      <option value="instagram">Instagram</option>
                      <option value="google">Google</option>
                      <option value="facebook">Facebook</option>
                      <option value="passando">Passando na rua</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Observações / Necessidades Especiais</label>
                  <textarea value={formData.notes} onChange={e => update('notes', e.target.value)}
                    rows={3} placeholder="Dificuldades de aprendizado, alergias, informações importantes..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
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
              Efetivar Matrícula
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
