'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, RefreshCw, Calendar, Search, Filter, User, Clock, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AbsencesView() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRemarcarModal, setShowRemarcarModal] = useState<any>(null);
  const [remarcarData, setRemarcarData] = useState({ date: '', start_time: '08:00', end_time: '09:00', notes: '' });
  const [savingRemarcar, setSavingRemarcar] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
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

  const confirmLesson = async (id: string) => {
    await supabase.from('schedules').update({ status: 'concluido', admin_confirmed: true }).eq('id', id);
    fetchData();
    toast.success('Aula confirmada! ✅');
  };

  const rejectLesson = async (id: string) => {
    await supabase.from('schedules').update({ status: 'cancelado', admin_confirmed: false }).eq('id', id);
    fetchData();
    toast.error('Aula recusada!');
  };

  const remarcarAula = async () => {
    if (!showRemarcarModal || !remarcarData.date) {
      toast.error('Informe a nova data!');
      return;
    }
    setSavingRemarcar(true);
    try {
      await supabase.from('schedules').insert({
        date: remarcarData.date,
        start_time: remarcarData.start_time,
        end_time: remarcarData.end_time,
        subject: showRemarcarModal.subject,
        student_name: showRemarcarModal.student_name,
        student_id: showRemarcarModal.student_id,
        teacher_id: showRemarcarModal.teacher_id,
        teacher_name: showRemarcarModal.teacher_name,
        room: showRemarcarModal.room,
        notes: remarcarData.notes || 'Reposicao da aula de ' + showRemarcarModal.date,
        status: 'confirmado',
        reposicao_pendente: false,
        created_at: new Date().toISOString(),
      });
      await supabase.from('schedules').update({ reposicao_pendente: false, notes: (showRemarcarModal.notes || '') + ' | Remarcado para ' + remarcarData.date }).eq('id', showRemarcarModal.id);
      toast.success('Aula remarcada! ✅');
      setShowRemarcarModal(null);
      setRemarcarData({ date: '', start_time: '08:00', end_time: '09:00', notes: '' });
      fetchData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSavingRemarcar(false); }
  };

  const markReposicao = async (id: string) => {
    await supabase.from('schedules').update({ reposicao_pendente: true }).eq('id', id);
    fetchData();
    toast.success('Marcado como Reposição Pendente! 🔄');
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
    const matchDateRange = (!filterDateFrom && !filterDateTo) || 
      (filterDateFrom && filterDateTo ? s.date >= filterDateFrom && s.date <= filterDateTo :
       filterDateFrom ? s.date >= filterDateFrom : s.date <= filterDateTo);
    const matchStatus = filterStatus === 'all' ? true :
      filterStatus === 'concluido' ? s.status === 'concluido' :
      filterStatus === 'confirmado' ? (s.status === 'confirmado' || s.status === 'agendado') :
      filterStatus === 'aguardando' ? s.status === 'aguardando_confirmacao' :
      filterStatus === 'falta' ? s.attendance_status === 'falta' || s.attendance_status === 'Ausente' :
      filterStatus === 'justificada' ? s.attendance_status === 'justificada' || s.attendance_status === 'Justificada' :
      filterStatus === 'reposicao' ? s.reposicao_pendente === true : true;
    return matchSearch && matchTeacher && matchDate && matchDateRange && matchStatus;
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
        { label: 'Reposição Pendente', value: schedules.filter(s => s.reposicao_pendente).length, color: 'text-blue-600', bg: 'bg-blue-50', filter: 'reposicao' },
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
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="De" />
          </div>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="Até" />
          </div>
          <button onClick={() => { setFilterTeacher(''); setFilterDate(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterStatus('all'); setSearchTerm(''); }}
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
                  {s.status === 'aguardando_confirmacao' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => confirmLesson(s.id)}
                        className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all">
                        ✅ Confirmar
                      </button>
                      <button onClick={() => rejectLesson(s.id)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-all">
                        ❌ Recusar
                      </button>
                    </div>
                  )}
                  {(s.attendance_status === 'falta' || s.attendance_status === 'Ausente') && (
                    <button onClick={() => markNotified(s.id, false)}
                      className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-xs font-bold transition-all shrink-0">
                      Marcar Justificada
                    </button>
                  )}
                  {(s.attendance_status === 'justificada' || s.attendance_status === 'Justificada') && !s.reposicao_pendente && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => markNotified(s.id, true)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all">
                        Marcar Falta
                      </button>
                      <button onClick={() => markReposicao(s.id)}
                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all">
                        🔄 Reposição
                      </button>
                    </div>
                  )}
                  {s.reposicao_pendente && (
                    <div className="flex gap-2 shrink-0">
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                        🔄 Reposição Pendente
                      </span>
                      <button onClick={() => { setShowRemarcarModal(s); setRemarcarData({ date: '', start_time: s.start_time || '08:00', end_time: s.end_time || '09:00', notes: 'Reposicao da aula de ' + (s.date || '') }); }}
                        className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-bold transition-all">
                        📅 Remarcar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  
      {/* Modal Remarcar Aula */}
      {showRemarcarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Remarcar Aula</h2>
              <button onClick={() => setShowRemarcarModal(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl mb-4">
              <p className="font-black text-gray-900">{showRemarcarModal.subject}</p>
              <p className="text-sm text-gray-500">{showRemarcarModal.student_name} • Prof: {showRemarcarModal.teacher_name}</p>
              <p className="text-xs text-gray-400 mt-1">Aula original: {showRemarcarModal.date ? new Date(showRemarcarModal.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Nova Data *</label>
                <input type="date" value={remarcarData.date} onChange={e => setRemarcarData(r => ({ ...r, date: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Horário Início</label>
                  <input type="time" value={remarcarData.start_time} onChange={e => setRemarcarData(r => ({ ...r, start_time: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Horário Fim</label>
                  <input type="time" value={remarcarData.end_time} onChange={e => setRemarcarData(r => ({ ...r, end_time: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observação</label>
                <textarea rows={3} value={remarcarData.notes} onChange={e => setRemarcarData(r => ({ ...r, notes: e.target.value }))}
                  placeholder="Ex: Reposicao da aula do dia 10/05..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRemarcarModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={remarcarAula} disabled={savingRemarcar || !remarcarData.date}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {savingRemarcar ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📅'}
                {savingRemarcar ? 'Salvando...' : 'Confirmar Remarcação'}
              </button>
            </div>
          </div>
        </div>
      )}
  );
}