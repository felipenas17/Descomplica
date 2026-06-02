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
  const [filterPerformance, setFilterPerformance] = useState('Todos');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterSent, setFilterSent] = useState('todos');
  const [teachers, setTeachers] = useState<any[]>([]);

  const fetchFeedbacks = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured (feedbacks).');
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
    const channel = supabase
      .channel('feedbacks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, () => {
        fetchFeedbacks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    const sendWhatsApp = async (feedback: any) => {
    // Busca telefone do pai pelo nome do aluno
    const { data } = await supabase
      .from('students')
      .select('parent_name, parent_phone')
      .ilike('name', feedback.student_name)
      .limit(1)
      .single();

    const phone = data?.parent_phone?.replace(/\D/g, '');
    const parentName = data?.parent_name || 'Responsável';

    if (!phone) {
      alert('Telefone do responsável não cadastrado para este aluno.');
      return;
    }

    const stars = '⭐'.repeat(feedback.rating || 0);
    const msg = encodeURIComponent(
      `Olá, ${parentName}! 👋

` +
      `Segue o relatório da aula de *${feedback.subject}* do(a) *${feedback.student_name}*:

` +
      `📊 *Desempenho:* ${feedback.performance}
` +
      `✅ *Presença:* ${feedback.attendance || 'Presente'}
` +
      `⭐ *Nota:* ${stars} (${feedback.rating}/5)
` +
      (feedback.observations ? `📝 *Observações:* ${feedback.observations}
` : '') +
      (feedback.homework_given ? `📚 *Dever de casa:* ${feedback.homework_description || 'Sim'}
` : '') +
      `
_Professora Descomplica — ${new Date().toLocaleDateString('pt-BR')}_`
    );

    window.open('https://wa.me/55' + phone + '?text=' + msg, '_blank');
  };

  return () => { isMounted = false; };
  }, [fetchFeedbacks]);

  const sendWhatsApp = async (feedback: any) => {
    const { data } = await supabase
      .from('students')
      .select('parent_name, parent_phone')
      .ilike('name', feedback.student_name)
      .limit(1)
      .single();
    const phone = (data?.parent_phone || '').replace(/[^0-9]/g, '');
    const parentName = data?.parent_name || 'Responsável';
    if (!phone) {
      alert('Telefone do responsável não cadastrado para este aluno.');
      return;
    }
    const stars = '⭐'.repeat(feedback.rating || 0);
    const msg = encodeURIComponent(
      'Olá, ' + parentName + '! 👋\n\n' +
      'Segue o relatório da aula de *' + feedback.subject + '* do(a) *' + feedback.student_name + '*:\n\n' +
      '📊 *Desempenho:* ' + feedback.performance + '\n' +
      '⭐ *Nota:* ' + stars + ' (' + feedback.rating + '/5)\n' +
      (feedback.observations ? '📝 *Observações:* ' + feedback.observations + '\n' : '') +
      '\n_Professora Descomplica — ' + new Date().toLocaleDateString('pt-BR') + '_'
    );
    window.open('https://wa.me/55' + phone + '?text=' + msg, '_blank');
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

  // Insights
  const averageRating = feedbacks.length > 0 
    ? (feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : 0;
  
  const badPerformanceCount = feedbacks.filter(f => f.performance === 'Ruim').length;
  
  const mostDifficultSubject = feedbacks.length > 0
    ? Object.entries(feedbacks.reduce((acc: any, f) => {
        if (f.performance === 'Ruim' || f.performance === 'Regular') {
          acc[f.subject] = (acc[f.subject] || 0) + 1;
        }
        return acc;
      }, {})).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '---'
    : '---';

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Média de Avaliação</p>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-black text-gray-900">{averageRating}</h3>
            <Star size={20} fill="#FFD700" stroke="#FFD700" className="drop-shadow-sm" />
          </div>
          <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> Satisfação estável
          </p>
        </div>

        <div className="md:col-span-1 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alertas de Desempenho</p>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-black text-rose-600">{badPerformanceCount}</h3>
            <AlertCircle size={20} className="text-rose-500" />
          </div>
          <p className="text-[10px] text-gray-400 font-bold mt-2">Feedbacks com status &quot;Ruim&quot;</p>
        </div>

        <div className="md:col-span-2 bg-gradient-to-br from-purple-700 to-purple-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <Zap size={18} className="text-purple-300" />
              Insights Pedagógicos
            </h3>
            <div className="space-y-2">
              <p className="text-xs font-bold text-purple-200 flex items-center gap-2">
                <ChevronRight size={14} /> Matéria com mais dificuldade: <span className="text-white">{mostDifficultSubject}</span>
              </p>
              <p className="text-xs font-bold text-purple-200 flex items-center gap-2">
                <ChevronRight size={14} /> Taxa de participação alta: <span className="text-white">78% das aulas</span>
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Award size={80} />
          </div>
        </div>
      </div>

      {/* Filters & List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-xl font-black text-gray-900">Histórico de Feedbacks</h3>
            <p className="text-xs font-bold text-gray-400 mt-1">Acompanhe o que está acontecendo em cada aula</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Aluno, Professor ou Matéria..."
                value={filterStr}
                onChange={(e) => setFilterStr(e.target.value)}
                className="pl-10 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold w-64 focus:ring-2 focus:ring-purple-600"
              />
            </div>
            
            <select 
              value={filterPerformance}
              onChange={(e) => setFilterPerformance(e.target.value)}
              className="px-6 py-3 bg-gray-50 border-none rounded-2xl text-xs font-black text-gray-600 focus:ring-2 focus:ring-purple-600"
            >
              <option value="Todos">Desempenho: Todos</option>
              <option value="Excelente">Excelente</option>
              <option value="Bom">Bom</option>
              <option value="Regular">Regular</option>
              <option value="Ruim">Ruim</option>
            </select>
          </div>
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

                <div className="flex gap-3 mt-6">
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
    </div>
  );
}
