'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Star, 
  User, 
  GraduationCap, 
  Calendar,
  AlertCircle,
  Eye,
  TrendingUp,
  Award,
  ChevronRight,
  X,
  Zap,
  Loader2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function FeedbacksView() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStr, setFilterStr] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [editingFeedback, setEditingFeedback] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [filterPerformance, setFilterPerformance] = useState('Todos');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterSent, setFilterSent] = useState('todos');
  const [teachers, setTeachers] = useState<any[]>([]);

  const fetchTeachers = React.useCallback(async () => {
    const { data } = await supabase.from('teachers').select('id, name').order('name');
    setTeachers(data || []);
  }, []);

  const fetchFeedbacks = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Supabase Feedbacks Error:', error.message);
      } else if (data) {
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchFeedbacks();
      }
    };
    load();
    fetchTeachers();
    const channel = supabase
      .channel('feedbacks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, () => {
        fetchFeedbacks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchFeedbacks]);

  const saveEditFeedback = async () => {
    if (!editingFeedback) return;
    setSavingEdit(true);
    try {
      await supabase.from('feedbacks').update({
        attendance: editingFeedback.attendance,
        discipline: editingFeedback.discipline,
        content: editingFeedback.content,
        resources: editingFeedback.resources,
        observations: editingFeedback.observations,
      }).eq('id', editingFeedback.id);
      setSelectedFeedback({ ...selectedFeedback, ...editingFeedback });
      setEditingFeedback(null);
      fetchFeedbacks();
    } catch(e: any) { alert('Erro: ' + e.message); }
    setSavingEdit(false);
  };

  const sendWhatsApp = async (feedback: any) => {
    const w = window.open('', '_blank');
    const { data } = await supabase
      .from('students')
      .select('parent_name, parent_phone')
      .ilike('name', feedback.student_name)
      .limit(1)
      .single();
    const phone = (data?.parent_phone || '').replace(/[^0-9]/g, '');
    const parentName = data?.parent_name || 'Responsável';
    if (!phone) {
      if (w) w.close();
      alert('Telefone do responsável não cadastrado para este aluno.');
      return;
    }
    const msg = encodeURIComponent(
      '*Relat\u00f3rio de Aula \u2014 Descomplica*\n\n' +
      'Ol\u00e1, ' + parentName + '!\n\n' +
      '*Aluno(a):* ' + feedback.student_name + '\n' +
      '*Professor(a):* ' + feedback.teacher_name + '\n' +
      '*Data:* ' + (feedback.class_date ? new Date(feedback.class_date + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')) + '\n\n' +
      '*Presen\u00e7a:* ' + (feedback.attendance || 'Presente') + '\n' +
      '*Disciplina:* ' + (feedback.discipline || feedback.subject || '') + '\n' +
      (feedback.content ? '*Conte\u00fado Abordado:* ' + feedback.content + '\n' : '') +
      (feedback.resources ? '*Recursos Utilizados:* ' + feedback.resources + '\n' : '') +
      (feedback.observations ? '*Observa\u00e7\u00f5es:* ' + feedback.observations + '\n' : '') +
      '\n_Descomplica \u2014 ' + new Date().toLocaleDateString('pt-BR') + '_'
    );
    const waUrl = 'https://wa.me/55' + phone + '?text=' + msg;
    if (w) { w.location.href = waUrl; } else { window.location.href = waUrl; }
    await supabase.from('feedbacks').update({ sent_to_parent: true, sent_to_parent_at: new Date().toISOString() }).eq('id', feedback.id);
    fetchFeedbacks();
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = !filterStr ||
      f.student_name?.toLowerCase().includes(filterStr.toLowerCase()) ||
      f.teacher_name?.toLowerCase().includes(filterStr.toLowerCase()) ||
      f.subject?.toLowerCase().includes(filterStr.toLowerCase());
    const matchesTeacher = !filterTeacher || f.teacher_name === filterTeacher;
    const matchesFrom = !filterDateFrom || f.class_date >= filterDateFrom;
    const matchesTo = !filterDateTo || f.class_date <= filterDateTo;
    const matchesSent = filterSent === 'todos' || (filterSent === 'enviado' && f.sent_to_parent) || (filterSent === 'nao_enviado' && !f.sent_to_parent);
    return matchesSearch && matchesTeacher && matchesFrom && matchesTo && matchesSent;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total</p>
          <h3 className="text-3xl font-black text-purple-600">{feedbacks.length}</h3>
          <p className="text-[10px] text-gray-400 mt-1">feedbacks registrados</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Enviados ao Pai</p>
          <h3 className="text-3xl font-black text-green-600">{feedbacks.filter(f => f.sent_to_parent).length}</h3>
          <p className="text-[10px] text-gray-400 mt-1">de {feedbacks.length} total</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Não Enviados</p>
          <h3 className="text-3xl font-black text-yellow-600">{feedbacks.filter(f => !f.sent_to_parent).length}</h3>
          <p className="text-[10px] text-gray-400 mt-1">pendentes de envio</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Este Mês</p>
          <h3 className="text-3xl font-black text-blue-600">{feedbacks.filter(f => f.class_date?.startsWith(new Date().toISOString().slice(0,7))).length}</h3>
          <p className="text-[10px] text-gray-400 mt-1">aulas registradas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input placeholder="Buscar aluno, professor, matéria..." value={filterStr} onChange={e => setFilterStr(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
          className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          <option value="">Todos os professores</option>
          {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
          className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <span className="text-gray-400 text-sm">até</span>
        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
          className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <select value={filterSent} onChange={e => setFilterSent(e.target.value)}
          className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          <option value="todos">Todos os status</option>
          <option value="enviado">✅ Enviados ao pai</option>
          <option value="nao_enviado">⏳ Não enviados</option>
        </select>
        {(filterStr || filterTeacher || filterDateFrom || filterDateTo || filterSent !== 'todos') && (
          <button onClick={() => { setFilterStr(''); setFilterTeacher(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterSent('todos'); }}
            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all">
            ✕ Limpar
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-black text-gray-900">Histórico de Feedbacks</h3>
          <span className="text-xs text-gray-400 font-bold">{filteredFeedbacks.length} resultado(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">
                <th className="px-8 py-5">Estudante</th>
                <th className="px-8 py-5">Professor</th>
                <th className="px-8 py-5">Matéria / Data</th>
                <th className="px-8 py-5">Presença</th>
                <th className="px-8 py-5">Enviado ao Pai</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-purple-600 mb-4" size={32} />
                    <p className="text-gray-400 font-bold">Carregando feedbacks...</p>
                  </td>
                </tr>
              ) : filteredFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold">
                    Nenhum feedback encontrado.
                  </td>
                </tr>
              ) : filteredFeedbacks.map((f) => (
                <tr 
                  key={f.id} 
                  className="group hover:bg-gray-50/50 transition-all cursor-pointer"
                  onClick={() => setSelectedFeedback(f)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <User size={20} />
                      </div>
                      <span className="font-black text-gray-900">{f.student_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <GraduationCap size={18} className="text-gray-400" />
                      <span className="font-bold text-gray-700">{f.teacher_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-black text-gray-900 uppercase text-[10px] tracking-tight">{f.subject}</p>
                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {new Date(f.class_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
                      f.attendance === 'Presente' || f.attendance === 'presente' ? 'bg-green-100 text-green-700' :
                      f.attendance === 'Justificada' || f.attendance === 'justificada' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {f.attendance || 'Presente'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {f.sent_to_parent ? (
                      <div>
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700">
                          ✅ Enviado
                        </span>
                        {f.sent_to_parent_at && (
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(f.sent_to_parent_at).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-500">
                        Não enviado
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 hover:bg-white rounded-xl text-gray-400 group-hover:text-purple-600 transition-all border border-transparent group-hover:border-purple-100 shadow-sm">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end md:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-white w-full max-w-3xl h-full md:h-[92vh] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 bg-purple-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Eye size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Detalhes do Feedback</h2>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Relatório pedagógico completo</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFeedback(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-gray-50 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estudante</p>
                    <p className="font-black text-gray-900">{selectedFeedback.student_name}</p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Professor(a)</p>
                    <p className="font-black text-gray-900">{selectedFeedback.teacher_name}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Presença e Disciplina */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Presença</p>
                      <span className={`text-sm font-black ${selectedFeedback.attendance === 'Presente' ? 'text-green-600' : selectedFeedback.attendance === 'Justificada' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {selectedFeedback.attendance || '---'}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Disciplina</p>
                      <p className="text-sm font-black text-gray-900">{selectedFeedback.discipline || '---'}</p>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Conteúdo Abordado</label>
                    <div className="p-4 bg-purple-50 text-purple-900 rounded-2xl text-sm font-bold">
                      {selectedFeedback.content || 'Não informado.'}
                    </div>
                  </div>

                  {/* Recursos */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Recursos Utilizados</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeedback.resources ? selectedFeedback.resources.split(', ').map((r: string) => (
                        <span key={r} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">{r}</span>
                      )) : <span className="text-sm text-gray-400">Não informado.</span>}
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Observações</label>
                    <div className="p-4 bg-gray-50 text-gray-700 rounded-2xl text-sm italic border border-gray-100">
                      &quot;{selectedFeedback.observations || 'Sem observações extras.'}&quot;
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 flex-wrap">
                  <button
                    onClick={() => setEditingFeedback({...selectedFeedback})}
                    className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black transition-all"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => sendWhatsApp(selectedFeedback)}
                    className="flex-1 py-5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Enviar para Responsável
                  </button>
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="flex-1 py-5 bg-purple-600 text-white rounded-2xl font-black shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Edição */}
      {editingFeedback && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">✏️ Editar Feedback</h2>
              <p className="text-xs text-gray-400 mt-1">{editingFeedback.student_name} — {editingFeedback.teacher_name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2">Presença</label>
                <div className="flex gap-2">
                  {['Presente','Ausente','Justificada'].map(a => (
                    <button key={a} onClick={() => setEditingFeedback((f: any) => ({...f, attendance: a}))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${editingFeedback.attendance === a ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2">Disciplina</label>
                <input type="text" value={editingFeedback.discipline || ''} onChange={e => setEditingFeedback((f: any) => ({...f, discipline: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2">Conteúdo Abordado</label>
                <textarea rows={2} value={editingFeedback.content || ''} onChange={e => setEditingFeedback((f: any) => ({...f, content: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2">Recursos Utilizados</label>
                <div className="flex flex-wrap gap-2">
                  {['Apostila','Caderno','Recursos Digitais','Exercícios','Livro','Quadro','Matriz','Jogos Pedagógicos'].map(r => (
                    <button key={r} onClick={() => {
                      const current = editingFeedback.resources ? editingFeedback.resources.split(', ').filter(Boolean) : [];
                      const updated = current.includes(r) ? current.filter((x: string) => x !== r) : [...current, r];
                      setEditingFeedback((f: any) => ({...f, resources: updated.join(', ')}));
                    }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${editingFeedback.resources?.includes(r) ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2">Observações</label>
                <textarea rows={3} value={editingFeedback.observations || ''} onChange={e => setEditingFeedback((f: any) => ({...f, observations: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setEditingFeedback(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={saveEditFeedback} disabled={savingEdit}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">
                {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
