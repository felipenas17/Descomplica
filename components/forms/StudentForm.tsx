'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, User, Mail, Hash, Phone, Calendar, School, Users, Clock, BookOpen, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface StudentFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  prefill?: any;
  isEditing?: boolean;
}

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function StudentForm({ onClose, onSubmit, prefill, isEditing }: StudentFormProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    if (prefill && isEditing) {
      setFormData(prev => ({
        ...prev,
        name: prefill.name || '',
        email: prefill.email || '',
        phone: prefill.phone || '',
        registration: prefill.registration || '',
        enrollment_type: prefill.enrollment_type || 'nova',
        monthly_value: prefill.monthly_value || '',
        parent_name: prefill.parent_name || '',
        parent_phone: prefill.parent_phone || '',
        parent_email: prefill.parent_email || '',
        parent_cpf: prefill.parent_cpf || '',
        parent_rg: prefill.parent_rg || '',
        parent_profession: prefill.parent_profession || '',
        age: prefill.age || '',
        birth_date: prefill.birth_date || '',
        sex: prefill.sex || '',
        school: prefill.school || '',
        grade: prefill.grade || '',
        segment: prefill.segment || '',
        school_shift: prefill.school_shift || '',
        special_needs: prefill.special_needs || [],
        has_allergy: prefill.has_allergy || '',
        allergy_details: prefill.allergy_details || '',
        lesson_type: prefill.lesson_type || 'individual',
        lesson_duration: prefill.lesson_duration || '60',
        notes: prefill.notes || '',
        weekly_frequency: prefill.weekly_frequency || '',
      }));
    }
  }, [prefill, isEditing]);
  const [daySchedules, setDaySchedules] = useState<Record<string, { start: string; end: string }>>({});
  const [showExtra, setShowExtra] = useState(false);
  const [formData, setFormData] = useState({
    name: prefill?.name || '',
    email: prefill?.email || '',
    registration: '',
    enrollment_type: 'nova',
    phone: prefill?.phone || '',
    parent_name: prefill?.parent_name || '',
    parent_phone: prefill?.parent_phone || '',
    parent_email: '',
    parent_cpf: '',
    parent_rg: '',
    parent_profession: '',
    age: '',
    birth_date: '',
    sex: '',
    school: '',
    grade: '',
    segment: '',
    school_shift: '',
    special_needs: [] as string[],
    special_needs_outros: '',
    has_allergy: '',
    allergy_details: '',
    lesson_type: 'individual',
    lesson_duration: '60',
    monthly_value: '',
    recurrence_start: new Date().toISOString().split('T')[0],
    recurrence_end: '',
    notes: prefill?.notes || '',
    weekly_frequency: '',
    address: '',
    address_complement: '',
    city: '',
    neighborhood: '',
    cep: '',
    how_found: '',
  });

  const update = (field: string, value: any) => setFormData(p => ({ ...p, [field]: value }));

  const toggleDay = (day: string) => {
    setSelectedDays(prev => {
      const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      if (!prev.includes(day)) {
        setDaySchedules(ds => ({ ...ds, [day]: { start: '08:00', end: '09:00' } }));
      } else {
        setDaySchedules(ds => { const n = { ...ds }; delete n[day]; return n; });
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentData = {
      ...formData,
      days_of_week: selectedDays.join(', '),
      day_schedules: JSON.stringify(daySchedules),
      monthly_value: parseFloat(formData.monthly_value) || 0,
      special_needs: Array.isArray(formData.special_needs) ? formData.special_needs.join(', ') : formData.special_needs,
    };
    onSubmit(studentData);

    if (!(selectedDays.length > 0 && formData.recurrence_start && formData.recurrence_end)) {
      onClose();
    }

    if (selectedDays.length > 0 && formData.recurrence_start && formData.recurrence_end) {
      const dayMap: Record<string, number> = {
        'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6
      };
      const start = new Date(formData.recurrence_start + 'T00:00:00');
      const end = new Date(formData.recurrence_end + 'T00:00:00');
      const schedulesToCreate = [];
      const current = new Date(start);

      while (current <= end) {
        const dayOfWeek = current.getDay();
        const matchingDay = selectedDays.find(d => dayMap[d] === dayOfWeek);
        if (matchingDay) {
          const sched = daySchedules[matchingDay] || { start: '08:00', end: '09:00' };
          schedulesToCreate.push({
            date: current.toISOString().split('T')[0],
            start_time: sched.start,
            end_time: sched.end,
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

        <div className="sticky top-0 bg-white rounded-t-3xl p-6 border-b border-gray-100 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-black text-purple-600">{isEditing ? 'Editar Aluno' : 'Matrícula de Aluno'}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{isEditing ? 'Edite os dados do aluno.' : 'Inscreva um novo aluno no sistema.'}</p>
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

            {/* Tipo de matrícula */}
            <div className="mb-4">
              <label className={labelClass}>Tipo de Matrícula</label>
              <div className="flex gap-2">
                {[{ value: 'nova', label: '🆕 Nova Matrícula' }, { value: 'renovacao', label: '🔄 Renovação' }].map(opt => (
                  <button type="button" key={opt.value}
                    onClick={() => update('enrollment_type', opt.value)}
                    className={`flex-1 p-3 rounded-2xl border-2 transition-all text-center text-sm font-bold ${formData.enrollment_type === opt.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

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
                <label className={labelClass}>Turno que Estuda</label>
                <div className="flex gap-2">
                  {[{ value: 'manha', label: '🌅 Manhã' }, { value: 'tarde', label: '☀️ Tarde' }].map(opt => (
                    <button type="button" key={opt.value}
                      onClick={() => update('school_shift', opt.value)}
                      className={`flex-1 p-3 rounded-2xl border-2 transition-all text-center text-sm font-bold ${formData.school_shift === opt.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {opt.label}
                    </button>
                  ))}
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
                <label className={labelClass}>Sexo</label>
                <div className="flex gap-2">
                  {[{ value: 'M', label: '♂ Masc.' }, { value: 'F', label: '♀ Fem.' }].map(opt => (
                    <button type="button" key={opt.value}
                      onClick={() => update('sex', opt.value)}
                      className={`flex-1 p-3 rounded-2xl border-2 transition-all text-center text-xs font-bold ${formData.sex === opt.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Segmento</label>
                <div className="relative">
                  <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <select value={formData.segment} onChange={e => update('segment', e.target.value)} className={selectClass}>
                    <option value="">Selecione...</option>
                    <option value="fundamental1">Fundamental 1</option>
                    <option value="fundamental2">Fundamental 2</option>
                    <option value="medio">Ensino Médio</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Ano Escolar</label>
                <div className="relative">
                  <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.grade} onChange={e => update('grade', e.target.value)} className={inputClass} placeholder="Ex: 7º Ano" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Escola do Aluno</label>
                <div className="relative">
                  <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.school} onChange={e => update('school', e.target.value)} className={inputClass} placeholder="Nome da escola" />
                </div>
              </div>
            </div>

            {/* Condições Especiais */}
            <div className="mt-4">
              <label className={labelClass}>O aluno possui alguma condição especial?</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Deficiência física','Deficiência intelectual','Deficiência auditiva','Deficiência visual','TEA (Autismo)','Dislexia','TDAH','Anomalia congenita','Encefalopatia','Em investigação','Outros','Nenhuma'].map(cond => (
                  <button type="button" key={cond}
                    onClick={() => {
                      const curr = Array.isArray(formData.special_needs) ? formData.special_needs : [];
                      const next = curr.includes(cond) ? curr.filter(c => c !== cond) : [...curr, cond];
                      setFormData(p => ({ ...p, special_needs: next }));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${Array.isArray(formData.special_needs) && formData.special_needs.includes(cond) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {cond}
                  </button>
                ))}
              </div>
              {Array.isArray(formData.special_needs) && formData.special_needs.includes('Outros') && (
                <input
                  type="text"
                  placeholder="Descreva a condição..."
                  value={formData.special_needs_outros || ''}
                  onChange={e => setFormData(p => ({ ...p, special_needs_outros: e.target.value }))}
                  className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              )}
            </div>

            {/* Alergia */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Possui alergia?</label>
                <div className="flex gap-2">
                  {[{ value: 'sim', label: '✅ Sim' }, { value: 'nao', label: '❌ Não' }].map(opt => (
                    <button type="button" key={opt.value}
                      onClick={() => update('has_allergy', opt.value)}
                      className={`flex-1 p-3 rounded-2xl border-2 transition-all text-center text-sm font-bold ${formData.has_allergy === opt.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {formData.has_allergy === 'sim' && (
                <div>
                  <label className={labelClass}>Quais alergias?</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input value={formData.allergy_details} onChange={e => update('allergy_details', e.target.value)} className={inputClass} placeholder="Descreva as alergias..." />
                  </div>
                </div>
              )}
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

            {/* Frequência semanal */}
            <div className="mb-4">
              <label className={labelClass}>Frequência Semanal</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '1', label: '1x por semana' },
                  { value: '2', label: '2x por semana' },
                  { value: '3', label: '3x por semana' },
                  { value: '4', label: '4x por semana' },
                  { value: '5', label: '5x por semana' },
                ].map(opt => (
                  <button type="button" key={opt.value}
                    onClick={() => update('weekly_frequency', opt.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.weekly_frequency === opt.value ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Valor Mensal */}
            <div className="mb-4">
              <label className={labelClass}>Valor da Mensalidade (R$) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                <input type="number" step="0.01" value={formData.monthly_value} onChange={e => update('monthly_value', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
                  placeholder="0,00" />
              </div>
            </div>

            {/* Duração */}
            <div className="mb-4">
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
                  ✅ Aulas geradas automaticamente nos dias selecionados com os horários definidos
                </p>
              )}
            </div>
          </div>

          {/* SEÇÃO 4: Contato */}
          <div>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Phone size={12} /> Contato
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Telefone Secundário</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.phone} onChange={e => update('phone', e.target.value)} className={inputClass} placeholder="(22) 99999-9999" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Nome do Responsável *</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.parent_name} onChange={e => update('parent_name', e.target.value)} className={inputClass} placeholder="Nome completo" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Celular do Responsável *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.parent_phone} onChange={e => update('parent_phone', e.target.value)} className={inputClass} placeholder="(22) 99999-9999" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Profissão do Responsável</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.parent_profession} onChange={e => update('parent_profession', e.target.value)} className={inputClass} placeholder="Ex: Professora" />
                </div>
              </div>
              <div>
                <label className={labelClass}>CPF do Responsável</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.parent_cpf} onChange={e => update('parent_cpf', e.target.value)} className={inputClass} placeholder="000.000.000-00" />
                </div>
              </div>
              <div>
                <label className={labelClass}>RG do Responsável</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={formData.parent_rg} onChange={e => update('parent_rg', e.target.value)} className={inputClass} placeholder="0000000-0" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>E-mail do Responsável</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="email" value={formData.parent_email} onChange={e => update('parent_email', e.target.value)} className={inputClass} placeholder="responsavel@email.com" />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 5: Informações Adicionais */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Rua / Avenida</label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input value={formData.address} onChange={e => update('address', e.target.value)} className={inputClass} placeholder="Rua, número..." />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Complemento</label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input value={formData.address_complement} onChange={e => update('address_complement', e.target.value)} className={inputClass} placeholder="Apto, bloco..." />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Bairro</label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input value={formData.neighborhood} onChange={e => update('neighborhood', e.target.value)} className={inputClass} placeholder="Bairro" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Cidade</label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input value={formData.city} onChange={e => update('city', e.target.value)} className={inputClass} placeholder="Cidade" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>CEP</label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input value={formData.cep} onChange={e => update('cep', e.target.value)} className={inputClass} placeholder="00000-000" />
                    </div>
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
                  <label className={labelClass}>Observações</label>
                  <textarea value={formData.notes} onChange={e => update('notes', e.target.value)}
                    rows={3} placeholder="Informações importantes..."
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
              {isEditing ? 'Salvar Alterações' : 'Efetivar Matrícula'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
