'use client';
import React, { useState, useEffect } from 'react';
import { Plus, X, Send, Users, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const TIPOS = [
        '*' + form.titulo + '*\n\n' +
  { value: 'financeiro', label: '💰 Financeiro', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'pedagogico', label: '📚 Pedagógico', color: 'bg-green-100 text-green-700' },
  { value: 'urgente', label: '🚨 Urgente', color: 'bg-red-100 text-red-700' },
  { value: 'evento', label: '🎉 Evento', color: 'bg-purple-100 text-purple-700' },
];

export default function ComunicadosView({ user }: { user?: any }) {
  const [comunicados, setComunicados] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [todosPais, setTodosPais] = useState(true);
  const [form, setForm] = useState({ titulo: '', mensagem: '', tipo: 'geral' });

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('comunicados_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comunicados' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: comData }, { data: studData }] = await Promise.all([
      supabase.from('comunicados').select('*').order('created_at', { ascending: false }),
      supabase.from('students').select('id, name, parent_name, parent_phone').eq('status', 'Ativo'),
    ]);
    setComunicados(comData || []);
    setStudents(studData || []);
    setLoading(false);
  };

  const enviarComunicado = async () => {
    if (!form.titulo || !form.mensagem) { toast.error('Preencha título e mensagem!'); return; }
    const destinatarios = todosPais
      ? students.filter(s => s.parent_phone)
      : students.filter(s => selectedStudents.includes(s.id) && s.parent_phone);

    if (destinatarios.length === 0) { toast.error('Nenhum responsável com telefone cadastrado!'); return; }

    setSending(true);

    // Salva no histórico
    const { error } = await supabase.from('comunicados').insert({
      titulo: form.titulo,
      mensagem: form.mensagem,
      tipo: form.tipo,
      destinatarios: destinatarios.map(d => ({ id: d.id, nome: d.name, responsavel: d.parent_name, telefone: d.parent_phone })),
      total_enviados: destinatarios.length,
      criado_por: user?.id,
      criado_por_nome: user?.name,
      created_at: new Date().toISOString(),
    });

    if (error) { toast.error('Erro ao salvar: ' + error.message); setSending(false); return; }

    // Abre WhatsApp para cada destinatário
    for (let i = 0; i < destinatarios.length; i++) {
      const dest = destinatarios[i];
      const tel = dest.parent_phone?.replace(/\D/g, '');
      if (!tel) continue;
      const msg = encodeURIComponent(
        'Ola, ' + (dest.parent_name || 'Responsavel') + '!\n\n' +
        '*' + form.titulo + '*\n\n' +
        form.mensagem + '\n\n' +
        '_Professora Descomplica — ' + new Date().toLocaleDateString('pt-BR') + '_'
      );
      window.open('https://wa.me/55' + tel + '?text=' + msg, '_blank');
      await new Promise(r => setTimeout(r, 800));
    }

    toast.success('✅ Comunicado enviado para ' + destinatarios.length + ' responsável(is)!');
    setShowModal(false);
    setForm({ titulo: '', mensagem: '', tipo: 'geral' });
    setSelectedStudents([]);
    setTodosPais(true);
    fetchData();
    setSending(false);
  };

  const getTipo = (tipo: string) => TIPOS.find(t => t.value === tipo) || TIPOS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
        '*' + form.titulo + '*\n\n' +
          <p className="text-sm text-gray-400 mt-1">Envie avisos em massa para os responsáveis via WhatsApp</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-200">
          <Plus size={16} /> Novo Comunicado
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Enviados', value: comunicados.length, color: 'text-purple-600' },
          { label: 'Este Mês', value: comunicados.filter(c => c.created_at?.startsWith(new Date().toISOString().slice(0,7))).length, color: 'text-blue-600' },
          { label: 'Responsáveis', value: students.filter(s => s.parent_phone).length, color: 'text-green-600' },
          { label: 'Sem Telefone', value: students.filter(s => !s.parent_phone).length, color: 'text-red-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-3xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900">Histórico de Comunicados</h3>
          <span className="text-xs text-gray-400 font-bold">{comunicados.length} comunicado(s)</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comunicados.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Nenhum comunicado enviado ainda.</p>
            <button onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all">
              Criar primeiro comunicado
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {comunicados.map(c => {
              const tipo = getTipo(c.tipo);
              return (
                <div key={c.id} className="p-5 hover:bg-gray-50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${tipo.color}`}>{tipo.label}</span>
                        <h4 className="font-black text-gray-900 text-sm">{c.titulo}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.mensagem}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {c.total_enviados} responsável(is)
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {c.criado_por_nome && (
                          <span>por {c.criado_por_nome}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                        <CheckCircle size={12} /> Enviado
                      </span>
                    </div>
                  </div>
                  {/* Destinatários */}
                  {c.destinatarios && c.destinatarios.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.destinatarios.slice(0, 5).map((d: any, i: number) => (
                        <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-bold">{d.nome}</span>
                      ))}
                      {c.destinatarios.length > 5 && (
                        <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded-lg font-bold">+{c.destinatarios.length - 5} mais</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Novo Comunicado */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl p-5 border-b border-gray-100 flex items-center justify-between">
        '*' + form.titulo + '*\n\n' +
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tipo</label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS.map(t => (
                    <button key={t.value} onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.tipo === t.value ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Título *</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ex: Recesso de julho"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Mensagem *</label>
                <textarea rows={4} value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                  placeholder="Digite a mensagem que será enviada para os responsáveis..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Destinatários</label>
                <div className="flex gap-3 mb-3">
                  <button onClick={() => setTodosPais(true)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${todosPais ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600'}`}>
                    👥 Todos os pais ({students.filter(s => s.parent_phone).length})
                  </button>
                  <button onClick={() => setTodosPais(false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${!todosPais ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600'}`}>
                    👤 Selecionar
                  </button>
                </div>
                {!todosPais && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {students.map(s => (
                      <label key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-purple-50 transition-all">
                        <input type="checkbox" checked={selectedStudents.includes(s.id)}
                          onChange={e => setSelectedStudents(prev => e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id))}
                          className="w-4 h-4 accent-purple-600" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.parent_name || 'Sem responsável'} {s.parent_phone ? '• ' + s.parent_phone : '• Sem telefone'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-bold">
                💡 O WhatsApp será aberto para cada responsável com a mensagem já preenchida. Você só precisa clicar em enviar!
              </div>
            </div>
            <div className="sticky bottom-0 bg-white rounded-b-3xl p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={enviarComunicado} disabled={sending}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                {sending ? 'Enviando...' : '📲 Enviar via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
