'use client';
import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const TIPOS = [
  { value: 'feriado', label: 'Feriado Nacional', color: 'bg-red-100 text-red-700' },
  { value: 'recesso', label: 'Recesso Escolar', color: 'bg-orange-100 text-orange-700' },
  { value: 'evento', label: 'Evento Especial', color: 'bg-blue-100 text-blue-700' },
  { value: 'outro', label: 'Outro', color: 'bg-gray-100 text-gray-700' },
];

const FERIADOS_2026 = [
  { titulo: 'Confraternizacao Universal', data: '2026-01-01', data_fim: '', tipo: 'feriado', recorrente: true },
  { titulo: 'Carnaval', data: '2026-02-16', data_fim: '2026-02-17', tipo: 'recesso', recorrente: false },
  { titulo: 'Sexta-feira Santa', data: '2026-04-03', data_fim: '', tipo: 'feriado', recorrente: true },
  { titulo: 'Tiradentes', data: '2026-04-21', data_fim: '', tipo: 'feriado', recorrente: true },
  { titulo: 'Dia do Trabalho', data: '2026-05-01', data_fim: '', tipo: 'feriado', recorrente: true },
  { titulo: 'Corpus Christi', data: '2026-06-04', data_fim: '', tipo: 'feriado', recorrente: false },
  { titulo: 'Independencia do Brasil', data: '2026-09-07', data_fim: '', tipo: 'feriado', recorrente: true },
  { titulo: 'Nossa Senhora Aparecida', data: '2026-10-12', data_fim: '', tipo: 'feriado', recorrente: true },
  { titulo: 'Finados', data: '2026-11-02', data_fim: '', tipo: 'feriado', recorrente: true },
  { titulo: 'Proclamacao da Republica', data: '2026-11-15', data_fim: '', tipo: 'feriado', recorrente: true },
  { titulo: 'Natal', data: '2026-12-25', data_fim: '', tipo: 'feriado', recorrente: true },
];

export default function FeriadosView({ user }: { user?: any }) {
  const [feriados, setFeriados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importando, setImportando] = useState(false);
  const [form, setForm] = useState({ titulo: '', data: '', data_fim: '', tipo: 'feriado', recorrente: false });

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('feriados_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feriados' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('feriados').select('*').order('data', { ascending: true });
    setFeriados(data || []);
    setLoading(false);
  };

  const salvar = async () => {
    if (!form.titulo || !form.data) { toast.error('Preencha titulo e data!'); return; }
    setSaving(true);
    const { error } = await supabase.from('feriados').insert({ ...form, criado_por: user?.id, created_at: new Date().toISOString() });
    if (error) { toast.error('Erro: ' + error.message); }
    else { toast.success('Adicionado!'); setShowModal(false); setForm({ titulo: '', data: '', data_fim: '', tipo: 'feriado', recorrente: false }); fetchData(); }
    setSaving(false);
  };

  const remover = async (id: string) => {
    if (!confirm('Remover?')) return;
    await supabase.from('feriados').delete().eq('id', id);
    toast.success('Removido!');
    fetchData();
  };

  const importarNacionais = async () => {
    setImportando(true);
    for (const f of FERIADOS_2026) {
      await supabase.from('feriados').insert({ ...f, criado_por: user?.id, created_at: new Date().toISOString() });
    }
    toast.success('Feriados nacionais de 2026 importados!');
    fetchData();
    setImportando(false);
  };

  const getTipo = (tipo: string) => TIPOS.find(t => t.value === tipo) || TIPOS[TIPOS.length - 1];
  const hojeD3 = new Date(); const hoje = hojeD3.getFullYear() + '-' + String(hojeD3.getMonth()+1).padStart(2,'0') + '-' + String(hojeD3.getDate()).padStart(2,'0');
  const proximos = feriados.filter(f => f.data >= hoje);
  const passados = feriados.filter(f => f.data < hoje);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Calendario Escolar</h1>
          <p className="text-sm text-gray-400 mt-1">Feriados, recessos e dias sem aula</p>
        </div>
        <div className="flex gap-3">
          <button onClick={importarNacionais} disabled={importando} className="px-4 py-2.5 border border-purple-300 text-purple-600 rounded-xl text-sm font-bold hover:bg-purple-50 transition-all">
            {importando ? 'Importando...' : 'Importar Feriados 2026'}
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: feriados.length, color: 'text-purple-600' },
          { label: 'Proximos', value: proximos.length, color: 'text-blue-600' },
          { label: 'Feriados', value: feriados.filter(f => f.tipo === 'feriado').length, color: 'text-red-600' },
          { label: 'Recessos', value: feriados.filter(f => f.tipo === 'recesso').length, color: 'text-orange-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-3xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900">Proximos Feriados e Recessos</h3>
          <span className="text-xs text-gray-400 font-bold">{proximos.length}</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : proximos.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Nenhum feriado cadastrado.</p>
            <button onClick={importarNacionais} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold">Importar Feriados Nacionais 2026</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {proximos.map(f => {
              const tipo = getTipo(f.tipo);
              const isHoje = f.data === hoje;
              return (
                <div key={f.id} className={`p-4 hover:bg-gray-50 transition-all flex items-center gap-4 ${isHoje ? 'bg-orange-50' : ''}`}>
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-black text-purple-600">{new Date(f.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}</span>
                    <span className="text-xl font-black text-purple-700">{new Date(f.data + 'T00:00:00').getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-gray-900 text-sm">{f.titulo}</p>
                      {isHoje && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">HOJE</span>}
                      {f.recorrente && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Anual</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${tipo.color}`}>{tipo.label}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(f.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                        {f.data_fim ? ' ate ' + new Date(f.data_fim + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : ''}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => remover(f.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {passados.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden opacity-60">
          <div className="p-5 border-b border-gray-100"><h3 className="font-black text-gray-700 text-sm">Passados ({passados.length})</h3></div>
          <div className="divide-y divide-gray-50">
            {passados.map(f => {
              const tipo = getTipo(f.tipo);
              return (
                <div key={f.id} className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-gray-400">{new Date(f.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}</span>
                    <span className="text-lg font-black text-gray-500">{new Date(f.data + 'T00:00:00').getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-600 text-sm">{f.titulo}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${tipo.color}`}>{tipo.label}</span>
                  </div>
                  <button onClick={() => remover(f.id)} className="p-2 text-gray-200 hover:text-red-400 rounded-xl transition-all"><Trash2 size={13} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">Novo Feriado / Recesso</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Titulo *</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Recesso de Julho"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tipo</label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS.map(t => (
                    <button key={t.value} onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.tipo === t.value ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Data Inicio *</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Data Fim</label>
                  <input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.recorrente} onChange={e => setForm(f => ({ ...f, recorrente: e.target.checked }))} className="w-4 h-4 accent-purple-600" />
                <span className="text-sm font-bold text-gray-700">Feriado anual (se repete todo ano)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={salvar} disabled={saving} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
