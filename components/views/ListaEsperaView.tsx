'use client';
import React, { useState, useEffect } from 'react';
import { Plus, X, Clock, Phone, BookOpen, CheckCircle, Trash2, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const TURNOS = ['Manhã', 'Tarde', 'Noite', 'Qualquer'];
const MATERIAS = ['Matemática', 'Português', 'História', 'Geografia', 'Ciências', 'Física', 'Química', 'Inglês', 'Redação', 'Outra'];

export default function ListaEsperaView({ user, setView }: { user?: any, setView?: (v: any) => void }) {
  const [lista, setLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', materia: '', turno: 'Qualquer', tipo_aula: 'individual', observacoes: '' });

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('lista_espera_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lista_espera' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('lista_espera').select('*').order('created_at', { ascending: true });
    const withDays = (data || []).map(item => ({
      ...item,
      dias_na_fila: Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))
    }));
    setLista(withDays);
    setLoading(false);
  };

  const salvar = async () => {
    if (!form.nome || !form.telefone) { toast.error('Preencha nome e telefone!'); return; }
    setSaving(true);
    const { error } = await supabase.from('lista_espera').insert({ ...form, status: 'aguardando', criado_por: user?.id, created_at: new Date().toISOString() });
    if (error) { toast.error('Erro: ' + error.message); }
    else {
      toast.success('Adicionado à lista de espera!');
      setShowModal(false);
      setForm({ nome: '', telefone: '', email: '', materia: '', turno: 'Qualquer', tipo_aula: 'individual', observacoes: '' });
      fetchData();
    }
    setSaving(false);
  };

  const contatar = async (item: any) => {
    const tel = item.telefone?.replace(/\D/g, '');
    if (!tel) { toast.error('Telefone inválido!'); return; }
    const msg = encodeURIComponent(
      'Olá, ' + item.nome + '! 😊\n\nSou da *Professora Descomplica*. Temos uma vaga disponível' +
      (item.materia ? ' para *' + item.materia + '*' : '') + '!\n\nGostaria de agendar uma conversa?\n\n_Professora Descomplica_'
    );
    window.open('https://wa.me/55' + tel + '?text=' + msg, '_blank');
    await supabase.from('lista_espera').update({ ultimo_contato: new Date().toISOString().split('T')[0] }).eq('id', item.id);
    fetchData();
  };

  const matricular = async (item: any) => {
    await supabase.from('lista_espera').update({ status: 'matriculado' }).eq('id', item.id);
    // Salva dados para pré-preencher o formulário
    sessionStorage.setItem('prefill_student', JSON.stringify({
      name: item.nome,
      phone: item.telefone,
      email: item.email || '',
      notes: item.observacoes || '',
      lesson_type: item.tipo_aula || 'individual',
      preferred_time: item.turno || '',
    }));
    toast.success('Redirecionando para matrícula...');
    fetchData();
    if (setView) setView('students');
  };

  const remover = async (id: string) => {
    if (!confirm('Remover da lista de espera?')) return;
    await supabase.from('lista_espera').delete().eq('id', id);
    toast.success('Removido da lista!');
    fetchData();
  };

  const aguardando = lista.filter(i => i.status === 'aguardando');
  const matriculados = lista.filter(i => i.status === 'matriculado');

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Lista de Espera</h1>
          <p className="text-sm text-gray-400 mt-1">Interessados aguardando uma vaga</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-200">
          <Plus size={16} /> Adicionar Interessado
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Na Fila', value: aguardando.length, color: 'text-yellow-600' },
          { label: 'Matriculados', value: matriculados.length, color: 'text-green-600' },
          { label: 'Esperando +7 dias', value: aguardando.filter(i => i.dias_na_fila >= 7).length, color: 'text-red-600' },
          { label: 'Total', value: lista.length, color: 'text-purple-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-3xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900">Aguardando Vaga</h3>
          <span className="text-xs text-gray-400 font-bold">{aguardando.length} interessado(s)</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : aguardando.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Nenhum interessado na lista.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {aguardando.map(item => (
              <div key={item.id} className="p-5 hover:bg-gray-50 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-black text-gray-900">{item.nome}</h4>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${item.dias_na_fila >= 7 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {item.dias_na_fila >= 7 ? '⚠️ ' : '🕐 '}{item.dias_na_fila} dia(s) na fila
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Phone size={11} /> {item.telefone}</span>
                      {item.materia && <span className="flex items-center gap-1"><BookOpen size={11} /> {item.materia}</span>}
                      {item.turno && <span>🕐 {item.turno}</span>}
                      {item.ultimo_contato && <span>📞 Último contato: {new Date(item.ultimo_contato + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                    </div>
                    {item.observacoes && <p className="text-xs text-gray-400 mt-1 italic">{item.observacoes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => contatar(item)} className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-all">
                      <MessageSquare size={12} /> WhatsApp
                    </button>
                    <button onClick={() => matricular(item)} className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all">
                      <CheckCircle size={12} /> Matricular
                    </button>
                    <button onClick={() => remover(item.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {matriculados.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100"><h3 className="font-black text-gray-900">Matriculados</h3></div>
          <div className="divide-y divide-gray-50">
            {matriculados.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-700 text-sm">{item.nome}</p>
                  <p className="text-xs text-gray-400">{item.materia} · {item.telefone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-green-100 text-green-700">Matriculado</span>
                  <button onClick={() => remover(item.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-all"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">Novo Interessado</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[{ label: 'Nome *', field: 'nome', placeholder: 'Nome completo' }, { label: 'Telefone *', field: 'telefone', placeholder: '(22) 99999-9999' }, { label: 'Email', field: 'email', placeholder: 'email@exemplo.com' }].map(f => (
                <div key={f.field}>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">{f.label}</label>
                  <input value={(form as any)[f.field]} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} placeholder={f.placeholder}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Matéria</label>
                <select value={form.materia} onChange={e => setForm(f => ({ ...f, materia: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Selecione...</option>
                  {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Turno</label>
                <div className="flex gap-2 flex-wrap">
                  {TURNOS.map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, turno: t }))}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${form.turno === t ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tipo de Aula</label>
                <div className="flex gap-2">
                  {['individual', 'dupla', 'grupo'].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, tipo_aula: t }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${form.tipo_aula === t ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observações</label>
                <textarea rows={3} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Informações adicionais..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white rounded-b-3xl p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={salvar} disabled={saving} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
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
