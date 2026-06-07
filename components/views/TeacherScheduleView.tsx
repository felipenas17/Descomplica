'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CalendarCheck, Clock, BookOpen, ChevronLeft, ChevronRight, User, MapPin, Play, Square, Star, MessageSquare, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const DAY_NAMES = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmado:        { label: 'CONFIRMADO',       color: 'bg-green-100 text-green-600' },
  agendado:          { label: 'AGENDADO',         color: 'bg-blue-100 text-blue-600' },
  reposicao_marcada: { label: 'REPOSICAO MARCADA', color: 'bg-purple-100 text-purple-600' },
  cancelado:     { label: 'CANCELADO',     color: 'bg-red-100 text-red-600' },
  concluido:     { label: 'CONCLUÍDO',     color: 'bg-gray-100 text-gray-500' },
  aguardando_confirmacao: { label: 'AGUARD. CONFIRMAÇÃO', color: 'bg-orange-100 text-orange-600' },
  em_andamento:  { label: 'EM ANDAMENTO',  color: 'bg-yellow-100 text-yellow-700' },
};

interface FeedbackForm {
  attendance: string;
  discipline: string;
  content: string;
  resources: string;
  notes: string;
}

export default function TeacherScheduleView({ user }: { user?: any }) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'hoje' | 'semana' | 'mes'>('semana');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [feedbackLesson, setFeedbackLesson] = useState<any>(null);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackForm>({
    attendance: 'Presente', discipline: '', content: '', resources: '', notes: ''
  });

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const [compromissos, setCompromissos] = useState<any[]>([]);
  const [anamneseLesson, setAnamneseLesson] = useState<any>(null);
  const [anamneseForm, setAnamneseForm] = useState({ nivel: '', dificuldades: '', materias_deficiencia: '', engajamento: '', conteudo_trabalhado: '', frequencia_recomendada: '', observacoes: '' });
  const [savingAnamnese, setSavingAnamnese] = useState(false);
  const [feriados, setFeriados] = useState<any[]>([]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let query = supabase.from('schedules').select('*').order('date', { ascending: true });
      if (user?.id) query = query.eq('teacher_id', user.id);
      if (period === 'hoje') {
        const todayLocal = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        query = query.eq('date', todayLocal);
      } else if (period === 'semana') {
        const end = new Date(today); end.setDate(today.getDate() + 7);
        const startLocal = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        const endLocal = end.getFullYear() + '-' + String(end.getMonth()+1).padStart(2,'0') + '-' + String(end.getDate()).padStart(2,'0');
        query = query.gte('date', startLocal).lte('date', endLocal);
      } else {
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const startLocal = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        const endLocal = end.getFullYear() + '-' + String(end.getMonth()+1).padStart(2,'0') + '-' + String(end.getDate()).padStart(2,'0');
        query = query.gte('date', startLocal).lte('date', endLocal);
      }
      const { data, error } = await query;
      if (error) throw error;

      // Busca aulas experimentais do professor
      const { data: expData } = await supabase.from('aulas_experimentais')
        .select('*')
        .eq('professor_id', user?.id)
        .neq('status', 'arquivada');
      const expLessons = (expData || []).map((e: any) => ({
        id: 'exp_' + e.id,
        exp_id: e.id,
        date: e.data,
        start_time: e.hora_inicio,
        end_time: e.hora_fim,
        subject: e.materia || 'Aula Experimental',
        student_name: e.nome,
        teacher_name: e.professor_nome,
        teacher_id: e.professor_id,
        status: 'experimental',
        is_experimental: true,
        exp_status: e.status,
        telefone: e.telefone,
      }));
      setLessons(prev => {
        const normais = prev.filter((l: any) => !l.is_experimental);
        return [...normais, ...expLessons];
      });

      // Busca compromissos do admin que envolvem este professor
      const { data: compMeu } = await supabase.from('admin_agenda').select('*').eq('teacher_id', user?.id).order('date', { ascending: true });
      const { data: compTodos } = await supabase.from('admin_agenda').select('*').eq('teacher_id', 'todos').order('date', { ascending: true });
      const allComp = [...(compMeu || []), ...(compTodos || [])].sort((a, b) => a.date.localeCompare(b.date));
      setCompromissos(allComp);
    } catch (e) { setLessons([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLessons();
    supabase.from('feriados').select('*').then(({ data }) => setFeriados(data || []));
  }, [period]);

  const salvarAnamnese = async () => {
    if (!anamneseLesson) return;
    setSavingAnamnese(true);
    try {
      const expId = anamneseLesson.exp_id;
      await supabase.from('aulas_experimentais').update({
        status: 'realizada',
        feedback_professor: JSON.stringify(anamneseForm),
      }).eq('id', expId);
      // Notifica admin
      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
      for (const admin of (admins || [])) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          title: 'Anamnese recebida: ' + anamneseLesson.student_name,
          message: 'O professor ' + user?.name + ' preencheu a anamnese da aula experimental de ' + anamneseLesson.student_name + '. Aguardando sua decisao.',
          type: 'info', read: false, created_at: new Date().toISOString(),
        });
      }
      setAnamneseLesson(null);
      setAnamneseForm({ nivel: '', dificuldades: '', materias_deficiencia: '', engajamento: '', conteudo_trabalhado: '', frequencia_recomendada: '', observacoes: '' });
      fetchLessons();
    } catch(e) { console.error(e); }
    setSavingAnamnese(false);
  };

  const startLesson = async (lesson: any) => {
    const { error } = await supabase.from('schedules').update({ status: 'em_andamento' }).eq('id', lesson.id);
    if (error) { toast.error('Erro ao iniciar aula'); return; }
    toast.success('Aula iniciada! ▶');
    fetchLessons();
  };

  const markAttendance = async (lesson: any, status: string) => {
    await supabase.from('schedules').update({ attendance_status: status }).eq('id', lesson.id);
    fetchLessons();
  };

  const openFeedback = (lesson: any) => {
    setFeedbackLesson(lesson);
    setFeedback({ attendance: 'Presente', discipline: '', content: '', resources: '', notes: '' });
  };

  const saveFeedback = async () => {
    if (!feedbackLesson) return;
    setSavingFeedback(true);
    try {
      // Salva feedback
      const { error: fbError } = await supabase.from('feedbacks').insert({
        schedule_id: feedbackLesson.id,
        teacher_id: user?.id,
        teacher_name: user?.name || feedbackLesson.teacher_name,
        student_name: feedbackLesson.student_name || 'Aluno',
        student_id: feedbackLesson.student_id || null,
        subject: feedbackLesson.subject || 'Aula',
        attendance: feedback.attendance,
        discipline: feedback.discipline,
        content: feedback.content,
        resources: feedback.resources,
        observations: feedback.notes,
        class_date: feedbackLesson.date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      });
      if (fbError) throw fbError;

      // Registra falta se ausente
      if (feedback.attendance === 'Ausente') {
        await supabase.from('absences').insert({
          student_id: feedbackLesson.student_id || null,
          student_name: feedbackLesson.student_name || 'Aluno',
          feedback_id: fbError ? null : null,
          schedule_id: feedbackLesson.id,
          absence_date: feedbackLesson.date,
          notified_advance: false,
          replenishment_done: false,
          extra_class_purchased: false,
          notes: feedback.notes || '',
          created_at: new Date().toISOString(),
        });

        // Notifica admin sobre a falta
        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
        if (admins && admins.length > 0) {
          await Promise.all(admins.map((admin: any) =>
            supabase.from('notifications').insert({
              user_id: admin.id,
              title: '⚠️ Falta registrada!',
              message: feedbackLesson.student_name + ' faltou na aula de ' + feedbackLesson.subject + ' em ' + new Date(feedbackLesson.date).toLocaleDateString('pt-BR') + '. Verifique se houve aviso prévio.',
              type: 'info',
              read: false,
              created_at: new Date().toISOString(),
            })
          ));
        }
      }

      // Muda status para aguardando confirmação do admin
      const { error: scError } = await supabase.from('schedules').update({ status: 'aguardando_confirmacao', attendance_status: feedback.attendance }).eq('id', feedbackLesson.id);
      if (scError) throw scError;

      // Notifica o admin para confirmar a aula
      const { data: admins3 } = await supabase.from('profiles').select('id').eq('role', 'admin');
      if (admins3 && admins3.length > 0) {
        await Promise.all(admins3.map((admin: any) =>
          supabase.from('notifications').insert({
            user_id: admin.id,
            title: '✅ Confirmar aula: ' + feedbackLesson.subject,
            message: user?.name + ' finalizou a aula de ' + feedbackLesson.subject + ' com ' + feedbackLesson.student_name + '. Presença: ' + feedback.attendance + '. Confirme para registrar como concluída.',
            type: 'confirm_class',
            read: false,
            schedule_id: feedbackLesson.id,
            created_at: new Date().toISOString(),
          })
        ));
      }
      const { data: admins2 } = await supabase.from('profiles').select('id').eq('role', 'admin');
      if (admins2 && admins2.length > 0) {
        await Promise.all(admins2.map((admin: any) =>
          supabase.from('notifications').insert({
            user_id: admin.id,
            title: 'Feedback de aula recebido! 📝',
            message: `${user?.name || 'Professor'} finalizou a aula de ${feedbackLesson.subject} com ${feedbackLesson.student_name}. Presença: ${feedback.attendance}.`,
            type: 'info',
            read: false,
            created_at: new Date().toISOString(),
          })
        ));
      }

      toast.success('Feedback enviado! Aguardando confirmação do admin ⏳');
      setFeedbackLesson(null);
      fetchLessons();
    } catch (e: any) {
      toast.error('Erro ao salvar feedback: ' + e.message);
    } finally { setSavingFeedback(false); }
  };

  const today = new Date().toISOString().split('T')[0];
  const aulasHoje = lessons.filter(l => l.date === today).length;
  const aulasConfirmadas = lessons.filter(l => l.status === 'confirmado' || l.status === 'em_andamento' || l.status === 'reposicao_marcada').length;
  const aulasConcluidas = lessons.filter(l => l.status === 'concluido').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <CalendarCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Agenda & Compromissos</h1>
            <p className="text-xs text-gray-400">Suas aulas e compromissos</p>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(['hoje', 'semana', 'mes'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${period === p ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
              {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mensal'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'AULAS HOJE', value: aulasHoje, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'CONFIRMADAS', value: aulasConfirmadas, icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'CONCLUÍDAS', value: aulasConcluidas, icon: CheckCircle, color: 'text-gray-500', bg: 'bg-gray-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
              <kpi.icon size={18} className={kpi.color} />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Aulas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{period === 'hoje' ? 'Aulas de Hoje' : period === 'semana' ? 'Aulas desta Semana' : 'Aulas do Mês'}</h2>
            <span className="text-xs text-gray-400">{lessons.length} aula{lessons.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="p-5 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12">
                <CalendarCheck size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Tudo em dia!</p>
                <p className="text-sm text-gray-300 mt-1">Nenhuma aula para este período.</p>
              </div>
            ) : (() => {
              const feriadosNoPeriodo = lessons.map(l => feriados.find(f => f.data === l.date || (f.data_fim && f.data <= l.date && f.data_fim >= l.date))).filter(Boolean);
              const feriadosUnicos = [...new Map(feriadosNoPeriodo.map(f => [f.id, f])).values()];
              return (<>
                {feriadosUnicos.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-red-600">{f.titulo}</p>
                      <p className="text-[10px] text-red-400">{new Date(f.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} — Feriado</p>
                    </div>
                  </div>
                ))}
              </>);
            })()}
            {lessons.map(lesson => {
              const isExp = (lesson as any).is_experimental;
              const status = isExp ? { bg: 'bg-amber-50', border: 'border-amber-400', badge: 'bg-amber-100 text-amber-800', label: 'EXPERIMENTAL' } : (STATUS_CONFIG[lesson.status || 'agendado'] || STATUS_CONFIG.agendado);
              const podeIniciar = !isExp && (lesson.status === 'confirmado' || lesson.status === 'agendado' || lesson.status === 'reposicao_marcada');
              const emAndamento = !isExp && lesson.status === 'em_andamento';
              const concluida = !isExp && lesson.status === 'concluido';
              return (
                <div key={lesson.id} className={`flex gap-4 p-4 rounded-xl border transition-all ${emAndamento ? 'border-yellow-200 bg-yellow-50/40' : 'border-gray-100 hover:border-purple-100 hover:bg-purple-50/20'}`}>
                  <div className={`w-1 rounded-full shrink-0 ${emAndamento ? 'bg-yellow-400' : concluida ? 'bg-gray-300' : 'bg-purple-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{lesson.subject || 'Aula'}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${(status as any).badge || (status as any).color}`}>{status.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {lesson.start_time && <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} />{lesson.start_time}{lesson.end_time ? ` - ${lesson.end_time}` : ''}</span>}
                      {lesson.student_name && <span className="flex items-center gap-1 text-xs text-gray-400"><User size={12} />{lesson.student_name}</span>}
                      {lesson.room && <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={12} />{lesson.room}</span>}
                    </div>
                    {lesson.notes && <p className="text-xs text-gray-400 mt-1 truncate">{lesson.notes}</p>}

                    {/* Botões de presença */}
                    {isExp && (lesson as any).exp_status === 'agendada' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setAnamneseLesson(lesson as any)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all">
                          Preencher Anamnese →
                        </button>
                      </div>
                    )}
                    {!isExp && !concluida && lesson.status !== 'aguardando_confirmacao' && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <button onClick={() => markAttendance(lesson, 'presente')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lesson.attendance_status === 'presente' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          ✅ Presente
                        </button>
                        <button onClick={() => markAttendance(lesson, 'falta')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lesson.attendance_status === 'falta' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                          ❌ Falta
                        </button>
                        <button onClick={() => markAttendance(lesson, 'justificada')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lesson.attendance_status === 'justificada' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                          📋 Justificada
                        </button>
                        {lesson.attendance_status && (
                          <button onClick={() => openFeedback(lesson)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all">
                            Finalizar & Enviar →
                          </button>
                        )}
                      </div>
                    )}
                    {lesson.status === 'aguardando_confirmacao' && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-yellow-600 font-medium">
                        ⏳ Aguardando confirmação do admin
                      </div>
                    )}
                    {concluida && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 font-medium">
                        <CheckCircle size={12} className="text-green-500" /> Aula concluída com feedback
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendário */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><ChevronLeft size={16} className="text-gray-500" /></button>
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">{MONTH_NAMES[currentDate.getMonth()]} DE {currentDate.getFullYear()}</h3>
            <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><ChevronRight size={16} className="text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map((d, i) => <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, i) => {
              const isToday = day && day.toDateString() === new Date().toDateString();
              const hasLesson = day && lessons.some(l => l.date === day.toISOString().split('T')[0]);
              const dateStr = day ? day.toISOString().split('T')[0] : '';
              const feriado = day ? feriados.find(f => f.data === dateStr || (f.data_fim && f.data <= dateStr && f.data_fim >= dateStr)) : null;
              return (
                <div key={i} title={feriado ? feriado.titulo : undefined}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-semibold transition-all relative overflow-hidden
                    ${!day ? '' : isToday ? 'bg-purple-600 text-white' : feriado ? 'bg-red-100 text-red-500' : hasLesson ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {feriado && !isToday && <div className="absolute inset-0 bg-red-200 opacity-30" />}
                  <span className="relative z-10">{day?.getDate()}</span>
                  {hasLesson && !isToday && !feriado && <div className="w-1 h-1 bg-purple-400 rounded-full mt-0.5" />}
                  {feriado && <div className="w-1 h-1 bg-red-400 rounded-full mt-0.5 relative z-10" />}
                </div>
              );
            })}
          </div>
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
                <div className="flex flex-wrap gap-2">
                  {['Apostila','Caderno','Vídeo','Exercícios','Livro','Quadro','Material Digital'].map(r => (
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
              <button onClick={() => setFeedbackLesson(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={saveFeedback} disabled={savingFeedback}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                {savingFeedback ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                {savingFeedback ? 'Salvando...' : 'Finalizar Aula'}
              </button>
            </div>
          </div>
        </div>
      )}
    {/* Compromissos do Admin */}
    {compromissos.length > 0 && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">📋 Reuniões & Compromissos</h3>
        </div>
        <div className="p-5 space-y-3">
          {compromissos.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{c.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(c.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  {c.start_time ? ' · ' + c.start_time : ''}
                  {c.end_time ? ' - ' + c.end_time : ''}
                </p>
                {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
              </div>
              <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                {c.type === 'reuniao_admin' ? '📋 Reunião' : c.type === 'reuniao_pais' ? '👨‍👩‍👧 Pais' : '📌'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
    {/* Modal Anamnese Experimental */}
    {anamneseLesson && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white rounded-t-3xl p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900">Anamnese — Aula Experimental</h2>
              <p className="text-xs text-gray-400 mt-0.5">{anamneseLesson.student_name}</p>
            </div>
            <button onClick={() => setAnamneseLesson(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">✕</button>
          </div>
          <div className="p-5 space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-700 font-bold">
              Preencha com cuidado — essas informacoes serao enviadas ao administrador para decidir sobre a matricula.
            </div>
            {[
              { label: 'Nivel do aluno', field: 'nivel', placeholder: 'Ex: Iniciante, Intermediario, Avancado' },
              { label: 'Principais dificuldades identificadas', field: 'dificuldades', placeholder: 'Descreva as dificuldades observadas...' },
              { label: 'Materias com mais deficiencia', field: 'materias_deficiencia', placeholder: 'Ex: Algebra, Interpretacao de texto...' },
              { label: 'Engajamento durante a aula', field: 'engajamento', placeholder: 'Ex: Alto, Medio, Baixo — como o aluno reagiu...' },
              { label: 'Conteudo trabalhado na aula', field: 'conteudo_trabalhado', placeholder: 'O que foi abordado na experimental...' },
              { label: 'Frequencia recomendada', field: 'frequencia_recomendada', placeholder: 'Ex: 2x por semana, 3x por semana...' },
              { label: 'Observacoes gerais', field: 'observacoes', placeholder: 'Qualquer informacao adicional relevante...' },
            ].map(f => (
              <div key={f.field}>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">{f.label}</label>
                <textarea rows={2} value={(anamneseForm as any)[f.field]}
                  onChange={e => setAnamneseForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            ))}
          </div>
          <div className="sticky bottom-0 bg-white rounded-b-3xl p-5 border-t border-gray-100 flex gap-3">
            <button onClick={() => setAnamneseLesson(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
            <button onClick={salvarAnamnese} disabled={savingAnamnese}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              {savingAnamnese ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {savingAnamnese ? 'Enviando...' : 'Enviar para Admin'}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
