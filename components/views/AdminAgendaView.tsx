'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Clock, FileText, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const TIPOS = [
  { value: 'reuniao_pais', label: '👨‍👩‍👧 Reunião com Pais', color: 'bg-blue-100 text-blue-700' },
  { value: 'reuniao_escola', label: '🏫 Visita/Reunião Escola', color: 'bg-green-100 text-green-700' },
  { value: 'reuniao_admin', label: '📋 Reunião Administrativa', color: 'bg-purple-100 text-purple-700' },
  { value: 'financeiro', label: '💰 Financeiro', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'pessoal', label: '👤 Pessoal', color: 'bg-pink-100 text-pink-700' },
  { value: 'outro', label: '📌 Outro', color: 'bg-gray-100 text-gray-700' },
];

export default function AdminAgendaView({ user }: { user?: any }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '09:00',
    type: 'outro',
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('admin_agenda')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    setEvents(data || []);
    setLoading(false);
  };

  const saveEvent = async () => {
    if (!form.title || !form.date) { toast.error('Preencha título e data!'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('admin_agenda').insert({
        ...form,
        user_id: user?.id,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Compromisso salvo! ✅');
      setShowForm(false);
      setForm({ title: '', description: '', date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '09:00', type: 'outro' });
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

  const filtered = events.filter(e => !filterDate || e.date === filterDate);

  // Agrupa por data
  const grouped: Record<string, any[]> = {};
  filtered.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  const getTipo = (type: string) => TIPOS.find(t => t.value === type) || TIPOS[TIPOS.length - 1];

  const hoje = new Date().toISOString().split('T')[0];
  const proximosEventos = events.filter(e => e.date >= hoje).slice(0, 3);

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

      {/* Próximos compromissos */}
      {proximosEventos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {proximosEventos.map(e => {
            const tipo = getTipo(e.type);
            return (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${tipo.color}`}>{tipo.label}</span>
                  {e.date === hoje && <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">HOJE</span>}
                </div>
                <p className="font-black text-gray-900 text-sm">{e.title}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Calendar size={12} />
                  <span>{new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  {e.start_time && <><Clock size={12} /><span>{e.start_time}{e.end_time ? ' - ' + e.end_time : ''}</span></>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtro */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        {filterDate && (
          <button onClick={() => setFilterDate('')}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-bold transition-all">
            Limpar
          </button>
        )}
      </div>

      {/* Lista por data */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <Calendar size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold">Nenhum compromisso encontrado.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all">
            Criar primeiro compromisso
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort().map(([date, evs]) => (
            <div key={date} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={`px-5 py-3 flex items-center gap-3 ${date === hoje ? 'bg-purple-600' : 'bg-gray-50 border-b border-gray-100'}`}>
                <Calendar size={16} className={date === hoje ? 'text-white' : 'text-gray-400'} />
                <span className={`font-black text-sm ${date === hoje ? 'text-white' : 'text-gray-700'}`}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                {date === hoje && <span className="ml-auto text-[10px] font-black bg-white text-purple-600 px-2 py-0.5 rounded-full">HOJE</span>}
              </div>
              <div className="divide-y divide-gray-50">
                {evs.map(e => {
                  const tipo = getTipo(e.type);
                  return (
                    <div key={e.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-all">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${tipo.color}`}>
                        {tipo.label.split(' ')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-gray-900 text-sm">{e.title}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tipo.color}`}>{tipo.label.split(' ').slice(1).join(' ')}</span>
                        </div>
                        {e.description && <p className="text-xs text-gray-500 mt-1">{e.description}</p>}
                        {e.start_time && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            <Clock size={11} />
                            <span>{e.start_time}{e.end_time ? ' - ' + e.end_time : ''}</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => deleteEvent(e.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Compromisso */}
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
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Descrição</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detalhes do compromisso..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
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
