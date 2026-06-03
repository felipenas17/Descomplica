'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Clock, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const TIPOS = [
  { value: 'reuniao_pais',  label: '👨‍👩‍👧 Reunião com Pais',       color: 'bg-blue-100 text-blue-700',   dot: '#3b82f6' },
  { value: 'reuniao_escola', label: '🏫 Visita/Reunião Escola',  color: 'bg-green-100 text-green-700',  dot: '#22c55e' },
  { value: 'reuniao_admin', label: '📋 Reunião Administrativa', color: 'bg-purple-100 text-purple-700', dot: '#a855f7' },
  { value: 'financeiro',    label: '💰 Financeiro',             color: 'bg-yellow-100 text-yellow-700', dot: '#eab308' },
  { value: 'pessoal',       label: '👤 Pessoal',                color: 'bg-pink-100 text-pink-700',    dot: '#ec4899' },
  { value: 'outro',         label: '📌 Outro',                  color: 'bg-gray-100 text-gray-700',    dot: '#6b7280' },
];

const DIAS = ['D','S','T','Q','Q','S','S'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function AdminAgendaView({ user }: { user?: any }) {
  const [events, setEvents]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [calDate, setCalDate]   = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00', end_time: '09:00', type: 'outro', teacher_id: '',
  });
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
    const channel = supabase
      .channel('admin_agenda_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_agenda' }, () => {
        fetchEvents();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_agenda').select('*').order('date').order('start_time');
    setEvents(data || []);
    setLoading(false);
  };

  const saveEvent = async () => {
    if (!form.title || !form.date) { toast.error('Preencha título e data!'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('admin_agenda').insert({ ...form, user_id: user?.id, created_at: new Date().toISOString() });
      if (error) throw error;
      // Notifica professor se selecionado
      if (form.teacher_id) {
        await supabase.from('notifications').insert({
          user_id: form.teacher_id,
          title: '📅 Reunião agendada: ' + form.title,
          message: 'Você tem um compromisso agendado para ' + new Date(form.date + 'T00:00:00').toLocaleDateString('pt-BR') + ' às ' + form.start_time + '.',
          type: 'info',
          read: false,
          created_at: new Date().toISOString(),
        });
      }
      toast.success('Compromisso salvo! ✅');
      setShowForm(false);
      setForm({ title: '', description: '', date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '09:00', type: 'outro', teacher_id: '' });
      fetchEvents();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Excluir este compromisso?')) return;
    await supabase.from('admin_agenda').delete().eq('id', id);
    fetchEvents();
    toast.success('Compromisso excluído!');
  };

  const getTipo = (type: string) => TIPOS.find(t => t.value === type) || TIPOS[TIPOS.length - 1];
  const hoje = new Date().toISOString().split('T')[0];

  // Calendário
  const year  = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (calDays.length % 7 !== 0) calDays.push(null);

  const eventsOnDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const selectedEvents = selectedDay ? events.filter(e => e.date === selectedDay) : [];

  // Lista agrupada (sem filtro de data quando calendário selecionado)
  const listEvents = selectedDay
    ? events.filter(e => e.date === selectedDay)
    : events.filter(e => e.date >= hoje);

  const grouped: Record<string, any[]> = {};
  listEvents.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Agenda & Compromissos</h1>
          <p className="text-sm text-gray-400 mt-1">Seus compromissos pessoais e reuniões</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-200">
          <Plus size={16} /> Novo Compromisso
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendário visual */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-all">
              <ChevronLeft size={18} />
            </button>
            <span className="font-black text-gray-900 text-sm">{MESES[month].toUpperCase()} {year}</span>
            <button onClick={() => setCalDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DIAS.map((d, i) => <div key={i} className="text-center text-[10px] font-black text-gray-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const evs = eventsOnDay(day);
              const isToday = dateStr === hoje;
              const isSelected = dateStr === selectedDay;
              return (
                <button key={i} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all ${isSelected ? 'bg-purple-600 text-white' : isToday ? 'bg-purple-50 text-purple-600' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <span className={`text-xs font-black ${isSelected ? 'text-white' : isToday ? 'text-purple-600' : ''}`}>{day}</span>
                  {evs.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {evs.slice(0, 3).map((e, j) => (
                        <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : getTipo(e.type).dot }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {selectedDay && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-gray-500">
                  {new Date(selectedDay + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </span>
                <button onClick={() => { setForm(f => ({ ...f, date: selectedDay })); setShowForm(true); }}
                  className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg hover:bg-purple-100 transition-all">
                  + Adicionar
                </button>
              </div>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Nenhum compromisso neste dia</p>
              ) : selectedEvents.map(e => {
                const tipo = getTipo(e.type);
                return (
                  <div key={e.id} className="flex items-center gap-2 py-1.5">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: tipo.dot, flexShrink: 0 }} />
                    <span className="text-xs font-bold text-gray-700 flex-1 truncate">{e.title}</span>
                    <span className="text-[10px] text-gray-400">{e.start_time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Próximos compromissos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-900 text-sm">
              {selectedDay
                ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
                : 'Próximos Compromissos'}
            </h3>
            {selectedDay && <button onClick={() => setSelectedDay(null)} className="text-[10px] text-gray-400 hover:text-gray-600 font-bold">Ver todos</button>}
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-bold">Nenhum compromisso {selectedDay ? 'neste dia' : 'próximo'}</p>
              <button onClick={() => setShowForm(true)} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all">
                Criar compromisso
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {Object.entries(grouped).sort().map(([date, evs]) => (
                <div key={date}>
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${date === hoje ? 'text-purple-600' : 'text-gray-400'}`}>
                    {date === hoje ? '📅 HOJE' : new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
                  </div>
                  {evs.map(e => {
                    const tipo = getTipo(e.type);
                    return (
                      <div key={e.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl mb-2 hover:bg-gray-100 transition-all group">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${tipo.color}`}>
                          {tipo.label.split(' ')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-sm truncate">{e.title}</p>
                          {e.description && <p className="text-xs text-gray-500 truncate mt-0.5">{e.description}</p>}
                          {e.start_time && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                              <Clock size={10} />
                              <span>{e.start_time}{e.end_time ? ' - ' + e.end_time : ''}</span>
                            </div>
                          )}
                        </div>
                        <button onClick={() => deleteEvent(e.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Novo Compromisso</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Título *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Reunião com pais do João"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tipo</label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.type === t.value ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Data *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Início</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Fim</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Professor Envolvido (opcional)</label>
                <select value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Nenhum</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Descrição</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detalhes do compromisso..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={saveEvent} disabled={saving}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
