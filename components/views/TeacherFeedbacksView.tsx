'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Star, User, Calendar, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface FeedbackForm {
  attendance: string;
  discipline: string;
  content: string;
  resources: string;
  notes: string;
}

export default function TeacherFeedbacksView({ user }: { user?: any }) {
  const [pendingLessons, setPendingLessons] = useState<any[]>([]);
  const [sentFeedbacks, setSentFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'sent'>('pending');
  const [filterPeriod, setFilterPeriod] = useState<'semana' | 'mes' | 'todos'>('semana');
  const [feedbackLesson, setFeedbackLesson] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackForm>({
    attendance: 'Presente',
    discipline: '',
    content: '',
    resources: '',
    notes: ''
  });

  useEffect(() => { fetchData(); }, [filterPeriod]);

  const fetchData = async () => {
    setLoading(true);
    if (!user?.id) return;

    // Apenas aulas que já aconteceram no período
    const hoje = new Date();
    const hojeStr = hoje.getFullYear() + '-' + String(hoje.getMonth()+1).padStart(2,'0') + '-' + String(hoje.getDate()).padStart(2,'0');
    const inicio = new Date();
    if (filterPeriod === 'semana') inicio.setDate(hoje.getDate() - 7);
    else if (filterPeriod === 'mes') inicio.setDate(1);
    else inicio.setFullYear(2020);
    const inicioStr = inicio.getFullYear() + '-' + String(inicio.getMonth()+1).padStart(2,'0') + '-' + String(inicio.getDate()).padStart(2,'0');
    const { data: lessons } = await supabase
      .from('schedules')
      .select('*')
      .eq('teacher_id', user.id)
      .lte('date', hojeStr)
      .gte('date', inicioStr)
      .order('date', { ascending: false });

    // Busca feedbacks já enviados
    const { data: feedbacks } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    const feedbackScheduleIds = new Set((feedbacks || []).map((f: any) => f.schedule_id));
    const pending = (lessons || []).filter(l => !feedbackScheduleIds.has(l.id) && l.attendance_status !== 'justificada' && l.attendance_status !== 'Justificada' && l.attendance_status !== 'falta');

    setPendingLessons(pending);
    setSentFeedbacks(feedbacks || []);
    setLoading(false);
  };

  const openFeedback = (lesson: any) => {
    setFeedbackLesson(lesson);
    setFeedback({ attendance: 'Presente', notes: '', discipline: '', content: '', resources: '' });
  };

  const saveFeedback = async () => {
    if (!feedbackLesson) return;
    setSaving(true);
    try {
      const { error: fbError } = await supabase.from('feedbacks').insert({
        schedule_id: feedbackLesson.id,
        teacher_id: user?.id,
        teacher_name: user?.name || feedbackLesson.teacher_name,
        student_name: feedbackLesson.student_name,
        student_id: feedbackLesson.student_id || null,
        subject: feedbackLesson.subject,
        attendance: feedback.attendance,
        discipline: feedback.discipline,
        content: feedback.content,
        resources: feedback.resources,
        observations: feedback.notes,
        class_date: feedbackLesson.date,
        created_at: new Date().toISOString(),
      });
      if (fbError) throw fbError;

      // Atualiza status
      await supabase.from('schedules').update({
        status: 'aguardando_confirmacao',
        attendance_status: feedback.attendance,
      }).eq('id', feedbackLesson.id);

      // Notifica admin
      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
      if (admins && admins.length > 0) {
        await Promise.all(admins.map((admin: any) =>
          supabase.from('notifications').insert({
            user_id: admin.id,
            title: '✅ Confirmar aula: ' + feedbackLesson.subject,
            message: (user?.name || 'Professor') + ' finalizou a aula de ' + feedbackLesson.subject + ' com ' + feedbackLesson.student_name + '. Presença: ' + feedback.attendance + '. Confirme para registrar como concluída.',
            type: 'confirm_class',
            read: false,
            schedule_id: feedbackLesson.id,
            created_at: new Date().toISOString(),
          })
        ));
      }

      // Falta automática
      if (feedback.attendance === 'Ausente' || feedback.attendance === 'falta') {
        await supabase.from('absences').insert({
          student_name: feedbackLesson.student_name,
          schedule_id: feedbackLesson.id,
          absence_date: feedbackLesson.date,
          notified_advance: false,
          created_at: new Date().toISOString(),
        });
      }

      toast.success('Feedback enviado! Aguardando confirmação do admin ⏳');
      setFeedbackLesson(null);
      fetchData();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
            <AlertCircle size={18} className="text-orange-500" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pendentes</p>
          <p className="text-2xl font-black text-orange-500 mt-1">{pendingLessons.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
            <CheckCircle size={18} className="text-green-500" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Enviados</p>
          <p className="text-2xl font-black text-green-500 mt-1">{sentFeedbacks.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex gap-2">
          {[
            { key: 'pending', label: `Pendentes (${pendingLessons.length})` },
            { key: 'sent', label: `Enviados (${sentFeedbacks.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : null}
          {activeTab === 'pending' && (
            <div className="flex gap-2 mb-4">
              {([['semana','Esta Semana'],['mes','Este Mês'],['todos','Todos']] as const).map(([val, label]) => (
                <button key={val} onClick={() => setFilterPeriod(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterPeriod === val ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {activeTab === 'pending' ? (
            pendingLessons.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={40} className="text-green-200 mx-auto mb-3" />
                <p className="text-gray-400 font-bold">Tudo em dia! Nenhum feedback pendente.</p>
              </div>
            ) : pendingLessons.map(lesson => (
              <div key={lesson.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-orange-100 bg-orange-50/30 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm">{lesson.subject || 'Aula'}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">Feedback Pendente</span>
                  </div>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {lesson.date && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={11} />{new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                    {lesson.student_name && <span className="text-xs text-gray-400 flex items-center gap-1"><User size={11} />{lesson.student_name}</span>}
                    {lesson.start_time && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} />{lesson.start_time}</span>}
                  </div>
                </div>
                <button onClick={() => openFeedback(lesson)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all">
                  Preencher Feedback →
                </button>
              </div>
            ))
          ) : (
            sentFeedbacks.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-bold">Nenhum feedback enviado ainda.</p>
              </div>
            ) : sentFeedbacks.map(fb => (
              <div key={fb.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{fb.subject}</p>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {fb.class_date && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={11} />{new Date(fb.class_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      {fb.student_name && <span className="text-xs text-gray-400 flex items-center gap-1"><User size={11} />{fb.student_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= (fb.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fb.performance === 'Excelente' ? 'bg-green-100 text-green-600' : fb.performance === 'Bom' ? 'bg-blue-100 text-blue-600' : fb.performance === 'Regular' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                      {fb.performance}
                    </span>
                  </div>
                </div>
                {fb.observations && <p className="text-xs text-gray-500 mt-2 italic">"{fb.observations}"</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Feedback */}
      {feedbackLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <MessageSquare size={20} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Feedback da Aula</h2>
                  <p className="text-xs text-gray-400">{feedbackLesson.subject} • {feedbackLesson.student_name}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Presença */}
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Presença</label>
                <div className="flex gap-2 flex-wrap">
                  {['Presente', 'Ausente', 'Justificada'].map(a => (
                    <button key={a} onClick={() => setFeedback(f => ({ ...f, attendance: a }))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${feedback.attendance === a ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disciplina */}
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Disciplina</label>
                <input type="text" placeholder="Ex: Matemática, Português..." value={feedback.discipline}
                  onChange={e => setFeedback(f => ({ ...f, discipline: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* Conteúdo Abordado */}
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Conteúdo Abordado</label>
                <textarea rows={2} placeholder="O que foi trabalhado na aula?" value={feedback.content}
                  onChange={e => setFeedback(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* Recursos Utilizados */}
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Recursos Utilizados</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Apostila','Caderno','Recursos Digitais','Exercícios','Livro','Quadro','Matriz','Jogos Pedagógicos'].map(r => (
                    <button key={r} onClick={() => {
                      const current = feedback.resources ? feedback.resources.split(', ').filter(Boolean) : [];
                      const updated = current.includes(r) ? current.filter(x => x !== r) : [...current, r];
                      setFeedback(f => ({ ...f, resources: updated.join(', ') }));
                    }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${feedback.resources?.includes(r) ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Observações</label>
                <textarea rows={3} placeholder="Pontos de atenção, próximos passos..." value={feedback.notes}
                  onChange={e => setFeedback(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setFeedbackLesson(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={saveFeedback} disabled={saving}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                {saving ? 'Enviando...' : 'Enviar Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
