'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, RefreshCw, Calendar, Search, Filter, User, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AbsencesView() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [schedulesRes, teachersRes] = await Promise.all([
      supabase.from('schedules').select('*').order('date', { ascending: false }),
      supabase.from('teachers').select('id, name').order('name'),
    ]);
    setSchedules(schedulesRes.data || []);
    setTeachers(teachersRes.data || []);
    setLoading(false);
  };

  const markNotified = async (id: string, current: boolean) => {
    await supabase.from('schedules').update({ attendance_status: current ? null : 'justificada' }).eq('id', id);
    fetchData();
    toast.success(current ? 'Marcado como falta' : 'Marcado como justificado ✅');
  };

  const filtered = schedules.filter(s => {
    const matchSearch = !searchTerm || 
      s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTeacher = !filterTeacher || s.teacher_id === filterTeacher;
    const matchDate = !filterDate || s.date === filterDate;
    const matchStatus = filterStatus === 'all' ? true :
      filterStatus === 'concluido' ? s.status === 'concluido' :
      filterStatus === 'confirmado' ? (s.status === 'confirmado' || s.status === 'agendado') :
      filterStatus === 'aguardando' ? s.status === 'aguardando_confirmacao' :
      filterStatus === 'falta' ? s.attendance_status === 'falta' || s.attendance_status === 'Ausente' :
      filterStatus === 'justificada' ? s.attendance_status === 'justificada' || s.attendance_status === 'Justificada' : true;
    return matchSearch && matchTeacher && matchDate && matchStatus;
  });

  const total = schedules.length;
  const concluidas = schedules.filter(s => s.status === 'concluido' && s.admin_confirmed).length;
  const aguardando = schedules.filter(s => s.status === 'aguardando_confirmacao').length;
  const faltas = schedules.filter(s => s.attendance_status === 'falta' || s.attendance_status === 'Ausente').length;
  const justificadas = schedules.filter(s => s.attendance_status === 'justificada' || s.attendance_status === 'Justificada').length;

  const getStatusLabel = (s: any) => {
    if (s.status === 'concluido' && s.admin_confirmed) return { label: 'Concluída', color: 'bg-green-100 text-green-700' };
    if (s.status === 'aguardando_confirmacao') return { label: 'Aguard. Confirmação', color: 'bg-orange-100 text-orange-700' };
    if (s.status === 'concluido') return { label: 'Concluída', color: 'bg-green-100 text-green-700' };
    if (s.status === 'cancelado') return { label: 'Cancelada', color: 'bg-red-100 text-red-700' };
    return { label: 'Agendada', color: 'bg-blue-100 text-blue-700' };
  };

  const getAttendanceLabel = (s: any) => {
    if (s.attendance_status === 'Presente' || s.attendance_status === 'presente') return { label: 'Presente', color: 'text-green-600' };
    if (s.attendance_status === 'falta' || s.attendance_status === 'Ausente') return { label: 'Falta', color: 'text-red-600' };
    if (s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') return { label: 'Justificada', color: 'text-yellow-600' };
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total de Aulas', value: total, color: 'text-purple-600', bg: 'bg-purple-50', filter: 'all' },
          { label: 'Concluídas', value: concluidas, color: 'text-green-600', bg: 'bg-green-50', filter: 'concluido' },
          { label: 'Aguardando', value: aguardando, color: 'text-orange-600', bg: 'bg-orange-50', filter: 'aguardando' },
          { label: 'Faltas', value: faltas, color: 'text-red-600', bg: 'bg-red-50', filter: 'falta' },
          { label: 'Justificadas', value: justificadas, color: 'text-yellow-600', bg: 'bg-yellow-50', filter: 'justificada' },
        ].map(kpi => (
          <button key={kpi.label} onClick={() => setFilterStatus(kpi.filter)}
            className={`bg-white rounded-2xl border shadow-sm p-5 text-left transition-all hover:shadow-md ${filterStatus === kpi.filter ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-100'}`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar aluno, professor..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 appearance-none">
              <option value="">Todos os professores</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <button onClick={() => { setFilterTeacher(''); setFilterDate(''); setFilterStatus('all'); setSearchTerm(''); }}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-bold transition-all">
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <BookOpen size={18} className="text-purple-500" /> Todas as Aulas
          </h2>
          <span className="text-xs text-gray-400 font-bold">{filtered.length} resultado(s)</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Nenhuma aula encontrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(s => {
              const status = getStatusLabel(s);
              const attendance = getAttendanceLabel(s);
              return (
                <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-all flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{s.subject || 'Aula'}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                      {attendance && <span className={`text-[10px] font-black ${attendance.color}`}>{attendance.label}</span>}
                    </div>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {s.date && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={11} />{new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      {s.start_time && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} />{s.start_time}{s.end_time ? ' - ' + s.end_time : ''}</span>}
                      {s.student_name && <span className="text-xs text-gray-400 flex items-center gap-1"><User size={11} />{s.student_name}</span>}
                      {s.teacher_name && <span className="text-xs text-gray-400">Prof: {s.teacher_name}</span>}
                    </div>
                  </div>
                  {/* Ação para marcar justificada */}
                  {(s.attendance_status === 'falta' || s.attendance_status === 'Ausente') && (
                    <button onClick={() => markNotified(s.id, false)}
                      className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-xs font-bold transition-all shrink-0">
                      Marcar Justificada
                    </button>
                  )}
                  {(s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') && (
                    <button onClick={() => markNotified(s.id, true)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all shrink-0">
                      Marcar Falta
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
