'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const HOURS = Array.from({ length: 21 }, (_, i) => 9 + i * 0.5); // 9h às 19h de 30 em 30min

const COLORS = [
  { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700' },
  { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
  { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700' },
  { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700' },
  { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-700' },
];

interface Lesson {
  id: string;
  date: string;
  time_start: string;
  time_end: string;
  subject: string;
  teacher_name?: string;
  teacher_id?: string;
  room?: string;
  student_name?: string;
  notes?: string;
  status?: string;
  attendance_status?: string;
  lesson_type?: string;
  admin_confirmed?: boolean;
}

interface NewLesson {
  date: string;
  time_start: string;
  time_end: string;
  subject: string;
  room: string;
  teacher_id: string;
  student_name: string;
  student_id: string;
  notes: string;
  recorrente?: boolean;
  recurrence_end?: string;
}

export default function SchoolCalendar({ user, onNavigate }: { user?: any, onNavigate?: (view: any) => void }) {
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newLesson, setNewLesson] = useState<NewLesson>({
    date: new Date().toISOString().split('T')[0],
    time_start: '08:00', time_end: '09:00',
    subject: '', room: '', teacher_id: '', student_name: '', student_id: '', notes: '', recorrente: false, recurrence_end: ''
  });
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<{id: string, name: string, color?: string, email?: string}[]>([]);
  const [showSubstModal, setShowSubstModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [lessonType, setLessonType] = useState<'individual' | 'dupla' | 'grupo' | 'avulsa'>('individual');
  const [extraStudents, setExtraStudents] = useState<{id: string, name: string}[]>([{ id: '', name: '' }]);
  const [showDecisaoModal, setShowDecisaoModal] = useState(false);
  const [expSelecionada, setExpSelecionada] = useState<any>(null);
  const [anamneseData, setAnamneseData] = useState<any>(null);
  const [savingExp, setSavingExp] = useState(false);
  const [expForm, setExpForm] = useState({
    nome: '', telefone: '', email: '', materia: '',
    professor_id: '', data: new Date().toISOString().split('T')[0],
    hora_inicio: '08:00', hora_fim: '09:00',
  });
  const [substData, setSubstData] = useState({ professor_id: '', motivo: '' });
  const [savingSubst, setSavingSubst] = useState(false);
  const [feriados, setFeriados] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('feriados').select('*').then(({ data }) => setFeriados(data || []));
  }, []);

  const tomarDecisao = async (decisao: string, motivo?: string) => {
    if (!expSelecionada) return;
    const expId = expSelecionada.exp_id;
    await supabase.from('aulas_experimentais').update({
      status: decisao,
      resultado: decisao,
      motivo_nao_conversao: motivo || null,
    }).eq('id', expId);
    setShowDecisaoModal(false);
    setExpSelecionada(null);
    setAnamneseData(null);
    fetchLessons();
  };

  const salvarExperimental = async () => {
    if (!expForm.nome || !expForm.telefone || !expForm.data) return;
    setSavingExp(true);
    try {
      const prof = teachers.find(t => t.id === expForm.professor_id);
      const { error } = await supabase.from('aulas_experimentais').insert({
        ...expForm,
        professor_nome: prof?.name || '',
        status: 'agendada',
        criado_por: user?.id,
        created_at: new Date().toISOString(),
      });
      if (!error) {
        // Notifica professor
        if (expForm.professor_id) {
          const expProfEmail = teachers.find(t => t.id === expForm.professor_id)?.email || '';
          const { data: expProfProfile } = await supabase.from('profiles').select('id').eq('email', expProfEmail).single();
          const expNotifId = expProfProfile?.id || expForm.professor_id;
          await supabase.from('notifications').insert({
            user_id: expNotifId,
            title: 'Aula experimental agendada!',
            message: 'Voce tem uma aula experimental com ' + expForm.nome + ' em ' + new Date(expForm.data + 'T00:00:00').toLocaleDateString('pt-BR') + ' as ' + expForm.hora_inicio + '.',
            type: 'info', read: false, created_at: new Date().toISOString(),
          });
        }
        setShowExpModal(false);
        setExpForm({ nome: '', telefone: '', email: '', materia: '', professor_id: '', data: new Date().toISOString().split('T')[0], hora_inicio: '08:00', hora_fim: '09:00' });
        fetchLessons();
      }
    } catch (e) { console.error(e); }
    setSavingExp(false);
  };

  const substituirProfessor = async () => {
    if (!substData.professor_id || !selectedLesson) return;
    setSavingSubst(true);
    try {
      const novoProf = teachers.find(t => t.id === substData.professor_id);
      // Salva histórico
      await supabase.from('substituicoes').insert({
        schedule_id: selectedLesson.id,
        professor_original_id: selectedLesson.teacher_id,
        professor_original_nome: selectedLesson.teacher_name,
        professor_substituto_id: substData.professor_id,
        professor_substituto_nome: novoProf?.name,
        motivo: substData.motivo,
        created_at: new Date().toISOString(),
      });
      // Atualiza a aula
      const vinculoId = vinculosSelecionados.length === 1 ? vinculosSelecionados[0] : null;
      await supabase.from('schedules').update({
        teacher_id: substData.professor_id,
        teacher_name: novoProf?.name,
        notes: (selectedLesson.notes || '') + ' | Substituido: ' + (selectedLesson.teacher_name) + ' por ' + novoProf?.name,
        reposicao_de_id: vinculoId,
      }).eq('id', selectedLesson.id);
      if (vinculoId) {
        await supabase.from('schedules').update({ reposicao_pendente: false, status: 'reposicao_marcada' }).eq('id', vinculoId);
      }
      // Notifica professor substituto
      const substEmail = teachers.find(t => t.id === substData.professor_id)?.email || '';
      const { data: substProfile } = await supabase.from('profiles').select('id').eq('email', substEmail).single();
      const substNotifId = substProfile?.id || substData.professor_id;
      await supabase.from('notifications').insert({
        user_id: substNotifId,
        title: 'Voce foi designado para uma aula!',
        message: 'Voce substituira ' + selectedLesson.teacher_name + ' na aula de ' + selectedLesson.subject + ' com ' + selectedLesson.student_name + ' em ' + new Date(selectedLesson.date + 'T00:00:00').toLocaleDateString('pt-BR') + '.',
        type: 'info', read: false, created_at: new Date().toISOString(),
      });
      // Notifica professor original
      if (selectedLesson.teacher_id) {
        const origEmail = teachers.find(t => t.id === selectedLesson.teacher_id)?.email || '';
        const { data: origProfile } = await supabase.from('profiles').select('id').eq('email', origEmail).single();
        const origNotifId = origProfile?.id || selectedLesson.teacher_id;
        await supabase.from('notifications').insert({
          user_id: origNotifId,
          title: 'Sua aula foi redistribuida',
          message: 'A aula de ' + selectedLesson.subject + ' com ' + selectedLesson.student_name + ' em ' + new Date(selectedLesson.date + 'T00:00:00').toLocaleDateString('pt-BR') + ' foi atribuida a ' + novoProf?.name + '.',
          type: 'warning', read: false, created_at: new Date().toISOString(),
        });
      }
      setShowSubstModal(false);
      setSubstData({ professor_id: '', motivo: '' });
      setSelectedLesson(null);
      setEditingLesson(null);
      fetchLessons();
    } catch (e: any) { console.error(e); }
    setSavingSubst(false);
  };

  const getFeriadoNaData = (date: string) => {
    return feriados.find((f: any) => f.data === date || (f.data_fim && f.data <= date && f.data_fim >= date));
  };
  const [students, setStudents] = useState<{id: string, name: string}[]>([]);
  const [dragLesson, setDragLesson] = useState<Lesson | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [reposicoesPendentesDetectadas, setReposicoesPendentesDetectadas] = useState<any[]>([]);
  const [vinculosSelecionados, setVinculosSelecionados] = useState<string[]>([]);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [motivoModal, setMotivoModal] = useState<{ tipo: 'justificar' | 'falta', lesson: Lesson } | null>(null);
  const [motivoTexto, setMotivoTexto] = useState('');
  const [motivoTag, setMotivoTag] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [teacherAvailability, setTeacherAvailability] = useState<any>(null);
  const [teacherBusySlots, setTeacherBusySlots] = useState<any[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ newDate: '', newTime: '', reason: '' });

  const fetchTeachersAndStudents = async () => {
    const [teachersRes, studentsRes] = await Promise.all([
      supabase.from('teachers').select('id, name, color, email').order('name'),
      supabase.from('students').select('id, name').order('name'),
    ]);
    setTeachers(teachersRes.data || []);
    setStudents(studentsRes.data || []);
  };

  const isAdmin = user?.role === 'admin' || !user?.role;

  const fetchTeacherAvailability = async (teacherId: string, date: string) => {
    if (!teacherId || !date) { setTeacherAvailability(null); setTeacherBusySlots([]); return; }
    const [teacherRes, schedulesRes] = await Promise.all([
      supabase.from('teachers').select('availability, availability_schedule').eq('id', teacherId).single(),
      supabase.from('schedules').select('start_time, end_time, student_name').eq('teacher_id', teacherId).eq('date', date),
    ]);
    setTeacherAvailability(teacherRes.data);
    setTeacherBusySlots(schedulesRes.data || []);
  };

  const saveEdit = async () => {
    if (!editingLesson) return;
    setSavingEdit(true);
    try {
      await supabase.from('schedules').update({
        date: editingLesson.date,
        start_time: editingLesson.time_start,
        end_time: editingLesson.time_end,
        subject: editingLesson.subject,
        teacher_id: editingLesson.teacher_id,
        teacher_name: teachers.find(t => t.id === editingLesson.teacher_id)?.name || editingLesson.teacher_name,
        room: editingLesson.room,
        notes: editingLesson.notes,
      }).eq('id', editingLesson.id);
      toast.success('Aula atualizada! ✅');
      setSelectedLesson(null);
      setEditingLesson(null);
      fetchLessons();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally { setSavingEdit(false); }
  };

  const handleDrop = (newDate: string, newTime: string) => {
    if (!dragLesson || !isAdmin) return;
    setRescheduleData({ newDate, newTime, reason: '' });
    setShowRescheduleModal(true);
  };

  const confirmReschedule = async () => {
    if (!dragLesson || !rescheduleData.reason.trim()) {
      toast.error('Por favor, informe o motivo da remarcação!');
      return;
    }
    try {
      await supabase.from('schedules').update({
        date: rescheduleData.newDate,
        start_time: rescheduleData.newTime,
        notes: (dragLesson.notes ? dragLesson.notes + ' | ' : '') + 'Remarcado: ' + rescheduleData.reason,
      }).eq('id', dragLesson.id);
      toast.success('Aula remarcada! ✅');
      setShowRescheduleModal(false);
      setDragLesson(null);
      fetchLessons();
    } catch (e: any) {
      toast.error('Erro ao remarcar: ' + e.message);
    }
  };

  useEffect(() => { fetchLessons(); fetchTeachersAndStudents(); }, [currentDate, view, isAdmin]);

  const fetchLessons = async () => {
    if (lessons.length === 0) setLoading(true);
    try {
      let query = supabase.from('schedules').select('*').order('date').order('time_start');
      if (!isAdmin && user?.id) query = query.eq('teacher_id', user.id);

      const refDate = new Date(currentDate);
      let start: string | null = null;
      let end: string | null = null;
      const ld = (d: Date) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      if (view === 'day') { start = end = ld(refDate); }
      else if (view === 'week') {
        const dow = refDate.getDay();
        const s = new Date(refDate); s.setDate(s.getDate() - (dow === 0 ? 6 : dow - 1));
        const e = new Date(s); e.setDate(s.getDate() + 6);
        start = ld(s); end = ld(e);
      } else if (view === 'month') {
        start = ld(new Date(refDate.getFullYear(), refDate.getMonth(), 1));
        end = ld(new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0));
      } else if (view === 'year') {
        start = ld(new Date(refDate.getFullYear(), 0, 1));
        end = ld(new Date(refDate.getFullYear(), 11, 31));
      }
      if (start && end) {
        query = query.gte('date', start).lte('date', end);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Busca aulas experimentais
      let expQuery = supabase.from('aulas_experimentais').select('*').neq('status', 'arquivada');
      if (start && end) expQuery = expQuery.gte('data', start).lte('data', end);
      const { data: expData } = await expQuery;

      // Converte experimentais para o formato de lesson
      const expLessons = (expData || []).map((e: any) => ({
        id: 'exp_' + e.id,
        exp_id: e.id,
        date: e.data,
        time_start: e.hora_inicio,
        time_end: e.hora_fim,
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
        feedback_professor: e.feedback_professor,
      }));

      if ((data || []).length > 0 || expLessons.length > 0) setLessons([...(data || []), ...expLessons]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') {
      // Vai para a segunda da semana atual, depois avança/volta 7 dias
      const dow = d.getDay();
      const toMonday = dow === 0 ? -6 : 1 - dow;
      d.setDate(d.getDate() + toMonday + dir * 7);
    }
    else if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'year') d.setFullYear(d.getFullYear() + dir);
    setCurrentDate(new Date(d));
  };

  const toLocalDateStr = (d: Date) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const dayOfWeek = start.getDay(); // 0=dom, 1=seg, ..., 6=sab
    // Semana começa na segunda: se domingo, volta 6 dias; senão volta (dayOfWeek-1)
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    });
  }, [currentDate]);

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

  const getLessonsForDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = y + '-' + m + '-' + d;
    const result = lessons.filter(l => l.date === dateStr);
    return result;
  };

  const getTeacherColor = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.color || null;
  };

  const getLessonColor = (lesson: any, idx: number) => {
    if ((lesson as any).is_experimental) return { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700', hex: null };
    if (lesson.lesson_type === 'avulsa') return { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', hex: null };
    if (lesson.status === 'concluido') return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', hex: null };
    if (lesson.status === 'aguardando_confirmacao') return { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', hex: null };
    if (lesson.status === 'cancelado') return { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', hex: null };
    if (lesson.status === 'reposicao_marcada') return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', hex: null };
    if (lesson.status === 'em_andamento') return { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', hex: null };
    const hex = getTeacherColor(lesson.teacher_id);
    if (hex) return { bg: '', border: '', text: '', hex };
    return { ...COLORS[idx % COLORS.length], hex: null };
  };

  const getLessonTop = (timeStart: string) => {
    const [h, m] = timeStart.split(':').map(Number);
    return ((h - 7) * 40) + (m / 60 * 40);
  };

  const getLessonHeight = (timeStart: string, timeEnd: string) => {
    const [sh, sm] = timeStart.split(':').map(Number);
    const [eh, em] = timeEnd.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max(mins / 60 * 80, 40);
  };

  const checkReposicaoPendente = async (studentsList: {id: string, name: string}[]) => {
    const validStudents = studentsList.filter(s => s.id || s.name);
    if (validStudents.length === 0) { setReposicoesPendentesDetectadas([]); return; }
    const results: any[] = [];
    for (const st of validStudents) {
      let query = supabase.from('schedules').select('*').eq('reposicao_pendente', true).neq('status', 'reposicao_concluida').neq('status', 'reposicao_marcada');
      if (st.id) query = query.eq('student_id', st.id);
      else query = query.ilike('student_name', st.name);
      const { data } = await query.limit(1);
      if (data && data.length > 0) results.push(data[0]);
    }
    setReposicoesPendentesDetectadas(results);
    setVinculosSelecionados([]);
  };
  const saveLesson = async () => {
    if (!newLesson.date) {
      toast.error('Preencha pelo menos a matéria e a data!');
      return;
    }
    setSaving(true);
    const recGroupId = (newLesson.recorrente && newLesson.recurrence_end) ? crypto.randomUUID() : null;
    try {
      const { error } = await supabase.from('schedules').insert({
        date: newLesson.date,
        start_time: newLesson.time_start,
        end_time: newLesson.time_end,
        subject: newLesson.subject,
        room: newLesson.room,
        student_name: lessonType !== 'individual' && lessonType !== 'avulsa' ? extraStudents.filter(e => e.name).map(e => e.name).join(', ') : newLesson.student_name,
        student_id: newLesson.student_id || null,
        lesson_type: lessonType,
        teacher_id: newLesson.teacher_id || user?.id || null,
        teacher_name: teachers.find(t => t.id === newLesson.teacher_id)?.name || user?.name || 'Admin',
        notes: newLesson.notes,
        status: 'confirmado',
        recurrence_group: recGroupId,
        reposicao_de_id: vinculosSelecionados.length === 1 ? vinculosSelecionados[0] : null,
      });
      if (error) throw error;
      for (const vincId of vinculosSelecionados) {
        await supabase.from('schedules').update({ reposicao_pendente: false, status: 'reposicao_marcada' }).eq('id', vincId);
      }
      setReposicoesPendentesDetectadas([]);
      setVinculosSelecionados([]);

      // Notificar o professor selecionado
      const teacherId = newLesson.teacher_id || user?.id || null;
      if (teacherId) {
        const teacherName = teachers.find(t => t.id === teacherId)?.name || 'Professor';
        const teacherEmail = teachers.find(t => t.id === teacherId)?.email || '';
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', teacherEmail)
          .single();
        const notifUserId = profileData?.id || teacherId;
        await supabase.from('notifications').insert({
          user_id: notifUserId,
          title: 'Nova aula agendada! 📅',
          message: `Você tem uma nova aula de ${newLesson.subject} marcada para ${newLesson.date} das ${newLesson.time_start} às ${newLesson.time_end}${newLesson.room ? ' na sala ' + newLesson.room : ''}.`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      toast.success('Aula incluída com sucesso! ✅');
      setShowModal(false);
      // Gera aulas recorrentes se marcado
      if (newLesson.recorrente && newLesson.recurrence_end) {
        const start = new Date(newLesson.date + 'T00:00:00');
        const end = new Date(newLesson.recurrence_end + 'T00:00:00');
        const dayOfWeek = start.getDay();
        const recurrentes = [];
        const cur = new Date(start);
        // recGroupId já definido acima — mesmo UUID da aula principal
        cur.setDate(cur.getDate() + 7);
        while (cur <= end) {
          if (cur.getDay() === dayOfWeek) {
            recurrentes.push({
              date: cur.toISOString().split('T')[0],
              time_start: newLesson.time_start, time_end: newLesson.time_end,
              start_time: newLesson.time_start, end_time: newLesson.time_end,
              subject: newLesson.subject || 'A definir',
              lesson_type: lessonType,
              extra_students: lessonType !== 'individual' ? JSON.stringify(extraStudents.filter(e => e.id).slice(1)) : null,
              teacher_id: newLesson.teacher_id || null,
              teacher_name: teachers.find(t => t.id === newLesson.teacher_id)?.name || '',
              student_id: newLesson.student_id || null,
              student_name: lessonType !== 'individual' && lessonType !== 'avulsa' ? extraStudents.filter(e => e.name).map(e => e.name).join(', ') : (newLesson.student_name || ''),
              room: newLesson.room || '',
              status: 'confirmado', notes: 'Aula recorrente', recurrence_group: recGroupId,
              created_at: new Date().toISOString(),
            });
          }
          cur.setDate(cur.getDate() + 1);
        }
        if (recurrentes.length > 0) {
          await supabase.from('schedules').insert(recurrentes);
        }
      }
      setNewLesson({ date: new Date().toISOString().split('T')[0], time_start: '08:00', time_end: '09:00', subject: '', room: '', teacher_id: '', student_id: '', student_name: '', notes: '', recorrente: false, recurrence_end: '' });
      setLessonType('individual');
      setExtraStudents([{ id: '', name: '' }]);
      fetchLessons();
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message); console.error('SAVE ERROR FULL:', JSON.stringify(e), e?.code, e?.details, e?.hint);
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Calendário {isAdmin ? 'Geral' : 'de Aulas'}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View selector */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['day','week','month','year'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${view === v ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {v === 'day' ? 'DIA' : v === 'week' ? 'SEMANA' : v === 'month' ? 'MÊS' : 'ANO'}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-500"><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-[10px] font-black text-gray-500 hover:bg-white rounded-lg">HOJE</button>
            <button onClick={() => navigate(1)} className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-500"><ChevronRight size={16} /></button>
          </div>

          {/* Add Lesson Button */}
          <button onClick={() => { setShowExpModal(true); fetchTeachersAndStudents(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-black uppercase transition-all">
            <Plus size={16} />
            Aula Experimental
          </button>
          <button onClick={() => { setShowModal(true); fetchTeachersAndStudents(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-black uppercase transition-all shadow-lg shadow-purple-200">
            <Plus size={16} />
            Incluir Aula
          </button>
        </div>
      </header>

      {/* Calendar Views */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">

        {/* WEEK VIEW */}
        {view === 'week' && (
          <div className="flex flex-col">
            <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="p-3 border-r border-gray-100 text-[10px] font-black text-gray-300 text-center flex-shrink-0" style={{ width: "48px" }}>HR</div>
              {weekDays.map((day) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const dayLessons = getLessonsForDate(day);
                const dateStr = toLocalDateStr(day);
                const feriado = getFeriadoNaData(dateStr);
                return (
                  <div key={day.toISOString()} className={`flex-1 p-3 text-center border-r border-gray-100 last:border-0 ${feriado ? 'bg-red-50' : ''}`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase">{DAYS_SHORT[day.getDay()]}</p>
                    <p className={`text-lg font-black mt-0.5 ${isToday ? 'w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto' : feriado ? 'text-red-500' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </p>
                    {feriado && <p className="text-[9px] text-red-400 font-bold truncate mt-0.5">{feriado.titulo}</p>}
                    {dayLessons.length > 0 && !feriado && <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mx-auto mt-1" />}
                  </div>
                );
              })}
            </div>

            <div className="overflow-y-auto max-h-[600px]">
              <table className="w-full border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: '48px' }} />
                  {weekDays.map((d) => <col key={toLocalDateStr(d)} />)}
                </colgroup>
                <tbody>
                  {HOURS.map((h) => {
                    const hrs = Math.floor(h);
                    const mins = h % 1 >= 0.4 ? 30 : 0;
                    const slotStart = hrs * 60 + mins;
                    const slotEnd = slotStart + 30;
                    const slotsByDay = weekDays.map(day => {
                      const dayLessons = getLessonsForDate(day);
                      return dayLessons.filter(l => {
                        const [lh, lm] = (l.time_start || (l as any).start_time || '08:00').split(':').map(Number);
                        const lStart = lh * 60 + lm;
                        return lStart >= slotStart && lStart < slotEnd;
                      });
                    });
                    const maxLessons = Math.max(...slotsByDay.map(s => s.length), 0);
                    const rowHeight = Math.max(maxLessons * 40, 40);
                    return (
                      <tr key={h} style={{ height: `${rowHeight}px` }}>
                        <td className="border-r border-b border-gray-100 px-2 align-top pt-1" style={{ minWidth: '48px' }}>
                          <span className="text-[9px] font-black text-gray-300">{hrs}:{mins === 0 ? '00' : '30'}</span>
                        </td>
                        {weekDays.map((day, dayIdx) => {
                          const isToday = day.toDateString() === new Date().toDateString();
                          const slotLessons = slotsByDay[dayIdx];
                          return (
                            <td key={day.toISOString()} className={`border-r border-b border-gray-50 last:border-r-0 p-0.5 align-top ${isToday ? 'bg-purple-50/30' : ''}`}>
                              {slotLessons.map((lesson, idx) => {
                                const color = getLessonColor(lesson, idx);
                                return (
                                  <div key={lesson.id}
                                    style={{ ...(color.hex ? { backgroundColor: color.hex + '22', borderLeftColor: color.hex, borderLeftWidth: '3px' } : {}), minHeight: '36px' }}
                                    onClick={() => {
                                      if ((lesson as any).is_experimental) {
                                        setExpSelecionada(lesson);
                                        const fb = (lesson as any).feedback_professor;
                                        try { setAnamneseData(fb ? JSON.parse(fb) : null); } catch { setAnamneseData(null); }
                                        setShowDecisaoModal(true);
                                      } else {
                                        setViewingLesson(lesson);
                                      }
                                    }}
                                    className={`${(lesson.attendance_status === 'justificada' || lesson.attendance_status === 'Justificada') ? 'bg-gray-100 border-l-4 border-gray-300 opacity-50' : color.hex ? '' : color.bg + ' border-l-4 ' + color.border} rounded p-1 mb-0.5 cursor-pointer hover:opacity-80 transition-all`}>
                                    <p className="text-[9px] font-black truncate leading-tight" style={color.hex && !(lesson.attendance_status === 'justificada' || lesson.attendance_status === 'Justificada') ? { color: color.hex } : {}}>{lesson.teacher_name || 'Prof.'}</p>
                                    <p className={`text-[8px] truncate leading-tight ${(lesson.attendance_status === 'justificada' || lesson.attendance_status === 'Justificada') ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{lesson.student_name}{(lesson.attendance_status === 'justificada' || lesson.attendance_status === 'Justificada') ? ' (Just.)' : ''}</p>
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DAY VIEW */}
        {view === 'day' && (
          <div className="flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-white text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase">{DAYS_SHORT[currentDate.getDay()]}</p>
              <p className="text-3xl font-black text-gray-900">{currentDate.getDate()}</p>
              <p className="text-xs text-gray-400">{getLessonsForDate(currentDate).length} aulas</p>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              <div className="grid grid-cols-[60px_1fr]">
                <div className="flex flex-col">
                  {HOURS.map(h => {
                    const hrs = Math.floor(h);
                    const mins = h % 1 >= 0.4 ? '30' : '00';
                    return <div key={h} className="h-10 border-r border-b border-gray-100 px-2 flex items-start pt-1"><span className="text-[9px] font-black text-gray-300">{hrs}:{mins}</span></div>;
                  })}
                </div>
                <div className="relative">
                  {HOURS.map(h => <div key={h} className="h-20 border-b border-gray-50" />)}
                  {getLessonsForDate(currentDate).map((lesson, idx) => {
                    const color = getLessonColor(lesson, idx);
                    const top = getLessonTop(lesson.time_start || '08:00');
                    const height = getLessonHeight(lesson.time_start || '08:00', lesson.time_end || '09:00');
                    return (
                      <div key={lesson.id} style={{ top: `${top}px`, height: `${height}px` }}
                        className={`absolute left-2 right-2 ${color.bg} border-l-4 ${color.border} rounded-xl p-3 z-10 overflow-hidden`}>
                        <p className={`text-xs font-black uppercase ${color.text}`}>{lesson.subject}</p>
                        <p className="text-[10px] text-gray-500">{(lesson as any).time_start || (lesson as any).start_time} - {(lesson as any).time_end || (lesson as any).end_time}</p>
                        <p className="text-[10px] text-gray-500 truncate">👤 {lesson.student_name}</p>
                        <p className="text-[10px] text-gray-500 truncate">🎓 {lesson.teacher_name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MONTH VIEW */}
        {view === 'month' && (
          <div>
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS_SHORT.map(d => <div key={d} className="p-3 text-center text-[10px] font-black text-gray-400 uppercase">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => {
                const dayLessons = day ? getLessonsForDate(day) : [];
                const isToday = day && day.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`min-h-[100px] p-2 border-r border-b border-gray-100 last:border-r-0 ${!day ? 'bg-gray-50/50' : ''} ${isToday ? 'bg-purple-50' : ''}`}>
                    {day && (
                      <>
                        <p className={`text-sm font-black mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-purple-600 text-white' : 'text-gray-700'}`}>
                          {day.getDate()}
                        </p>
                        <div className="space-y-0.5">
                          {dayLessons.slice(0, 3).map((lesson, idx) => {
                            const color = getLessonColor(lesson, idx);
                            return (
                              <div key={lesson.id} className={`${color.bg} ${color.text} text-[9px] font-bold px-1.5 py-0.5 rounded-lg truncate`}>
                                {lesson.time_start} {lesson.subject}
                              </div>
                            );
                          })}
                          {dayLessons.length > 3 && <p className="text-[9px] text-gray-400 font-bold">+{dayLessons.length - 3} mais</p>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* YEAR VIEW */}
        {view === 'year' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-6">
            {MONTHS.map((month, mIdx) => {
              const monthLessons = lessons.filter(l => new Date(l.date).getMonth() === mIdx);
              return (
                <div key={month} onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), mIdx, 1)); setView('month'); }}
                  className="bg-gray-50 hover:bg-purple-50 border border-gray-100 hover:border-purple-200 rounded-2xl p-4 cursor-pointer transition-all">
                  <p className="text-xs font-black text-gray-700 mb-2">{month.slice(0,3).toUpperCase()}</p>
                  <p className="text-2xl font-black text-purple-600">{monthLessons.length}</p>
                  <p className="text-[10px] text-gray-400">aula{monthLessons.length !== 1 ? 's' : ''}</p>
                </div>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Modal Incluir Aula */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <BookOpen size={20} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900">Incluir Aula</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">


              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Professor</label>
                <select
                  value={newLesson.teacher_id}
                  onChange={e => {
                    setNewLesson(p => ({ ...p, teacher_id: e.target.value }));
                    fetchTeacherAvailability(e.target.value, newLesson.date);
                  }}
                  className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="">Selecionar professor...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                {/* Painel de disponibilidade */}
                {newLesson.teacher_id && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl space-y-2">
                    {/* Horários ocupados */}
                    {teacherBusySlots.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1">🔴 Ocupado neste dia</p>
                        <div className="flex flex-wrap gap-1">
                          {teacherBusySlots.map((s, i) => (
                            <span key={i} className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-lg">
                              {s.start_time} - {s.end_time} ({s.student_name})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Disponibilidade cadastrada */}
                    {teacherAvailability?.availability_schedule && (() => {
                      try {
                        const sched = JSON.parse(teacherAvailability.availability_schedule);
                        const dayNames: Record<number, string> = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' };
                        const dayName = dayNames[new Date(newLesson.date + 'T00:00:00').getDay()];
                        const dayAvail = sched[dayName];
                        if (dayAvail) return (
                          <div>
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-wider mb-1">🟢 Disponível neste dia</p>
                            <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                              {dayAvail.start} - {dayAvail.end}
                            </span>
                          </div>
                        );
                        return <p className="text-[10px] text-gray-400 font-bold">Sem disponibilidade cadastrada para este dia</p>;
                      } catch { return null; }
                    })()}
                    {teacherBusySlots.length === 0 && !teacherAvailability?.availability_schedule && (
                      <p className="text-[10px] text-gray-400 font-bold">✅ Nenhuma aula neste dia</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Tipo de Aula</label>
                <div className="flex gap-2 mt-1">
                  {(['individual', 'dupla', 'grupo'] as const).map(tipo => (
                    <button key={tipo} type="button" onClick={() => {
                      setLessonType(tipo);
                      if (tipo === 'individual') setExtraStudents([{ id: '', name: '' }]);
                      if (tipo === 'dupla') setExtraStudents([{ id: '', name: '' }, { id: '', name: '' }]);
                      if (tipo === 'grupo') setExtraStudents([{ id: '', name: '' }, { id: '', name: '' }, { id: '', name: '' }, { id: '', name: '' }, { id: '', name: '' }, { id: '', name: '' }, { id: '', name: '' }, { id: '', name: '' }]);
                    }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${lessonType === tipo ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {tipo === 'individual' ? 'Individual' : tipo === 'dupla' ? 'Dupla' : 'Grupo'}
                    </button>
                  ))}
                  <button type="button" onClick={() => { setLessonType('avulsa'); setExtraStudents([{ id: '', name: '' }]); setNewLesson(p => ({ ...p, student_id: '', student_name: '' })); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${lessonType === 'avulsa' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                    Avulsa
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  {lessonType === 'avulsa' ? 'Aluno (avulso)' : lessonType === 'individual' ? 'Aluno' : lessonType === 'dupla' ? 'Alunos (2)' : 'Alunos (ate 8)'}
                </label>
                {lessonType === 'avulsa' ? (
                  <input type="text" placeholder="Digite o nome do aluno..." value={newLesson.student_name}
                    onChange={e => setNewLesson(p => ({ ...p, student_name: e.target.value, student_id: '' }))}
                    className="w-full mt-1 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                ) : (
                <div className="space-y-2 mt-1">
                  {extraStudents.map((es, idx) => (
                    <select key={idx} value={es.id}
                      onChange={e => {
                        const student = students.find(s => s.id === e.target.value);
                        const updated = [...extraStudents];
                        updated[idx] = { id: e.target.value, name: student?.name || '' };
                        setExtraStudents(updated);
                        if (idx === 0) setNewLesson(p => ({ ...p, student_id: e.target.value, student_name: student?.name || '' }));
                        checkReposicaoPendente(updated.map(u => ({ id: u.id, name: u.name })));
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                      <option value="">Aluno {idx + 1}...</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ))}
                </div>
                )}
                {reposicoesPendentesDetectadas.length > 0 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    {reposicoesPendentesDetectadas.map((rep: any) => (
                      <div key={rep.id}>
                        <p className="text-xs font-bold text-amber-700">
                          {rep.student_name} tem uma reposicao pendente: aula de {new Date(rep.date + 'T00:00:00').toLocaleDateString('pt-BR')} com {rep.teacher_name}.
                        </p>
                        <label className="flex items-center gap-2 mt-1 text-xs font-bold text-amber-700 cursor-pointer">
                          <input type="checkbox" checked={vinculosSelecionados.includes(rep.id)}
                            onChange={e => setVinculosSelecionados(v => e.target.checked ? [...v, rep.id] : v.filter(id => id !== rep.id))} />
                          Esta aula e a reposicao dessa aula pendente
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Data *</label>
                  <input type="date" value={newLesson.date} onChange={e => {
                    setNewLesson(p => ({ ...p, date: e.target.value }));
                    fetchTeacherAvailability(newLesson.teacher_id, e.target.value);
                  }}
                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  {newLesson.date && getFeriadoNaData(newLesson.date) && (
                    <div className="flex items-center gap-2 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs font-bold text-red-600">Feriado: {getFeriadoNaData(newLesson.date)?.titulo} — Tem certeza que quer agendar neste dia?</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Sala</label>
                  <input value={newLesson.room} onChange={e => setNewLesson(p => ({ ...p, room: e.target.value }))}
                    placeholder="Ex: Sala 01"
                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Início</label>
                  <input type="time" value={newLesson.time_start} onChange={e => setNewLesson(p => ({ ...p, time_start: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Fim</label>
                  <input type="time" value={newLesson.time_end} onChange={e => setNewLesson(p => ({ ...p, time_end: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Observações</label>
                <textarea value={newLesson.notes} onChange={e => setNewLesson(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Alguma observação..."
                  rows={2}
                  className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
              </div>
            </div>
              {/* Aula Recorrente */}
              <div className="p-3 bg-purple-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newLesson.recorrente || false}
                    onChange={e => setNewLesson(p => ({ ...p, recorrente: e.target.checked }))}
                    className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm font-bold text-purple-700">Aula recorrente (repetir semanalmente)</span>
                </label>
                {newLesson.recorrente && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Repetir ate</label>
                      <input type="date" value={newLesson.recurrence_end || ''}
                        onChange={e => setNewLesson(p => ({ ...p, recurrence_end: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                    <div className="flex items-end pb-1">
                      <p className="text-xs text-purple-600 font-bold">Uma aula por semana no mesmo dia e horario ate a data escolhida.</p>
                    </div>
                  </div>
                )}
              </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors">
                Cancelar
              </button>
              <button onClick={saveLesson} disabled={saving}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
                {saving ? 'Salvando...' : 'Incluir Aula'}
              </button>
            </div>
          </div>
        </div>
      )}
      

      {/* Modal Remarcação */}
      {showRescheduleModal && dragLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Remarcar Aula</h2>
              <button onClick={() => { setShowRescheduleModal(false); setDragLesson(null); }}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl mb-4">
              <p className="font-black text-gray-900">{dragLesson.subject}</p>
              <p className="text-sm text-gray-500">{dragLesson.student_name} • {dragLesson.date}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Nova Data</label>
                <input type="date" value={rescheduleData.newDate} onChange={e => setRescheduleData(r => ({ ...r, newDate: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Novo Horário</label>
                <input type="time" value={rescheduleData.newTime} onChange={e => setRescheduleData(r => ({ ...r, newTime: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                Motivo da Remarcação <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rescheduleData.reason}
                onChange={e => setRescheduleData(r => ({ ...r, reason: e.target.value }))}
                placeholder="Ex: Aluno pediu, Feriado, Professor indisponível..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">Campo obrigatório para fins de rastreabilidade</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowRescheduleModal(false); setDragLesson(null); }}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={confirmReschedule} disabled={!rescheduleData.reason.trim()}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">
                Confirmar Remarcação
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Editar Aula */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-600 text-sm font-black">E</span>
                </div>
                <h2 className="text-lg font-black text-gray-900">Nova Aula Experimental</h2>
              </div>
              <button onClick={() => setShowExpModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-700 font-bold">
                Aula experimental aparecera no calendario em amarelo. Apos realizada, voce decide se converte em matricula.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Nome do Interessado *</label>
                  <input value={expForm.nome} onChange={e => setExpForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Telefone *</label>
                  <input value={expForm.telefone} onChange={e => setExpForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(22) 99999-9999"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Email</label>
                  <input value={expForm.email} onChange={e => setExpForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Materia de Interesse</label>
                  <input value={expForm.materia} onChange={e => setExpForm(f => ({ ...f, materia: e.target.value }))} placeholder="Ex: Matematica"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Professor</label>
                  <select value={expForm.professor_id} onChange={e => setExpForm(f => ({ ...f, professor_id: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                    <option value="">Selecione...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Data *</label>
                  <input type="date" value={expForm.data} onChange={e => setExpForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Inicio</label>
                  <input type="time" value={expForm.hora_inicio} onChange={e => setExpForm(f => ({ ...f, hora_inicio: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Fim</label>
                  <input type="time" value={expForm.hora_fim} onChange={e => setExpForm(f => ({ ...f, hora_fim: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white rounded-b-3xl p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowExpModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={salvarExperimental} disabled={savingExp || !expForm.nome || !expForm.telefone}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {savingExp ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
                {savingExp ? 'Agendando...' : 'Agendar Experimental'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Decisão Experimental */}
      {showDecisaoModal && expSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">Aula Experimental</h2>
                <p className="text-xs text-gray-400 mt-0.5">{expSelecionada.student_name}</p>
              </div>
              <button onClick={() => setShowDecisaoModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Dados do interessado */}
              <div className="p-4 bg-amber-50 rounded-2xl">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">Dados do Interessado</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-[10px] text-gray-400 font-bold">Nome</p><p className="font-bold text-gray-900">{expSelecionada.student_name}</p></div>
                  <div><p className="text-[10px] text-gray-400 font-bold">Telefone</p><p className="font-bold text-gray-900">{expSelecionada.telefone || '-'}</p></div>
                  <div><p className="text-[10px] text-gray-400 font-bold">Materia</p><p className="font-bold text-gray-900">{expSelecionada.subject || '-'}</p></div>
                  <div><p className="text-[10px] text-gray-400 font-bold">Data</p><p className="font-bold text-gray-900">{expSelecionada.date ? new Date(expSelecionada.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p></div>
                </div>
                {expSelecionada.telefone && (
                  <a href={'https://wa.me/55' + expSelecionada.telefone.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-bold w-fit hover:bg-green-600 transition-all">
                    WhatsApp do Interessado
                  </a>
                )}
              </div>

              {/* Anamnese do professor */}
              {anamneseData ? (
                <div className="p-4 bg-purple-50 rounded-2xl">
                  <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-3">Anamnese do Professor</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Nivel do aluno', value: anamneseData.nivel },
                      { label: 'Principais dificuldades', value: anamneseData.dificuldades },
                      { label: 'Materias com deficiencia', value: anamneseData.materias_deficiencia },
                      { label: 'Engajamento', value: anamneseData.engajamento },
                      { label: 'Conteudo trabalhado', value: anamneseData.conteudo_trabalhado },
                      { label: 'Frequencia recomendada', value: anamneseData.frequencia_recomendada },
                      { label: 'Observacoes', value: anamneseData.observacoes },
                    ].filter(i => i.value).map(item => (
                      <div key={item.label}>
                        <p className="text-[10px] font-black text-gray-400 uppercase">{item.label}</p>
                        <p className="text-sm text-gray-800 mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-sm text-gray-400 font-bold">Anamnese ainda nao preenchida pelo professor.</p>
                </div>
              )}

              {/* Decisão */}
              {(expSelecionada as any).exp_status !== 'matriculado' && (expSelecionada as any).exp_status !== 'arquivada' && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tomar Decisao</p>
                  <div className="flex flex-col gap-2">
                    <button onClick={async () => {
                      await tomarDecisao('matriculado');
                      sessionStorage.setItem('prefill_student', JSON.stringify({
                        name: expSelecionada.student_name,
                        phone: expSelecionada.telefone || '',
                        notes: anamneseData ? 'Nivel: ' + (anamneseData.nivel || '') + ' | ' + (anamneseData.dificuldades || '') : '',
                      }));
                      if (onNavigate) onNavigate('students');
                    }}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all">
                      Matricular Aluno
                    </button>
                    <button onClick={() => {
                      const tel = expSelecionada.telefone?.replace(/\D/g, '');
                      if (tel) (() => { const _a = document.createElement('a'); _a.href = 'https://wa.me/55' + tel; _a.target = '_blank'; _a.rel = 'noopener noreferrer'; document.body.appendChild(_a); _a.click(); document.body.removeChild(_a); })();
                      tomarDecisao('negociando');
                    }}
                      className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all">
                      Entrar em Contato / Negociar
                    </button>
                    <button onClick={() => {
                      const motivo = prompt('Motivo para nao converter (opcional):');
                      tomarDecisao('arquivada', motivo || '');
                    }}
                      className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-bold transition-all">
                      Arquivar / Nao Convertido
                    </button>
                  </div>
                </div>
              )}

              {((expSelecionada as any).exp_status === 'matriculado' || (expSelecionada as any).exp_status === 'arquivada') && (
                <div className={`p-3 rounded-xl text-sm font-bold text-center ${(expSelecionada as any).exp_status === 'matriculado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {(expSelecionada as any).exp_status === 'matriculado' ? 'Aluno matriculado!' : 'Arquivado'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSubstModal && selectedLesson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900">Substituir Professor</h3>
              <button onClick={() => setShowSubstModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 rounded-xl text-sm">
                <p className="font-bold text-orange-700">Aula: {selectedLesson.subject}</p>
                <p className="text-orange-600 text-xs mt-1">{selectedLesson.student_name} · {new Date(selectedLesson.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                <p className="text-orange-600 text-xs">Professor atual: {selectedLesson.teacher_name}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Novo Professor *</label>
                <select value={substData.professor_id} onChange={e => setSubstData(d => ({ ...d, professor_id: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Selecione o substituto...</option>
                  {teachers.filter(t => t.id !== selectedLesson.teacher_id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Motivo</label>
                <textarea rows={2} value={substData.motivo} onChange={e => setSubstData(d => ({ ...d, motivo: e.target.value }))}
                  placeholder="Ex: Professor titular doente..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              {reposicoesPendentesDetectadas.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  {reposicoesPendentesDetectadas.map((rep: any) => (
                    <div key={rep.id}>
                      <p className="text-xs font-bold text-amber-700">
                        {rep.student_name} tem uma reposicao pendente: aula de {new Date(rep.date + 'T00:00:00').toLocaleDateString('pt-BR')} com {rep.teacher_name}.
                      </p>
                      <label className="flex items-center gap-2 mt-1 text-xs font-bold text-amber-700 cursor-pointer">
                        <input type="checkbox" checked={vinculosSelecionados.includes(rep.id)}
                          onChange={e => setVinculosSelecionados(v => e.target.checked ? [...v, rep.id] : v.filter(id => id !== rep.id))} />
                        Esta aula e a reposicao dessa aula pendente
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowSubstModal(false); setReposicoesPendentesDetectadas([]); setVinculosSelecionados([]); }} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">Cancelar</button>
              <button onClick={substituirProfessor} disabled={savingSubst || !substData.professor_id}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {savingSubst ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {savingSubst ? 'Substituindo...' : 'Confirmar Substituicao'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar Aula */}
      {viewingLesson && !selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">Detalhes da Aula</h2>
              <button onClick={() => setViewingLesson(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Professor', value: viewingLesson.teacher_name },
                { label: 'Aluno', value: viewingLesson.student_name },
                { label: 'Data', value: viewingLesson.date ? new Date(viewingLesson.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : '-' },
                { label: 'Horario', value: (viewingLesson.time_start || (viewingLesson as any).start_time || '') + ' - ' + (viewingLesson.time_end || (viewingLesson as any).end_time || '') },
                { label: 'Sala', value: (viewingLesson as any).room },
                { label: 'Status', value: viewingLesson.status },
                { label: 'Presenca', value: (viewingLesson as any).attendance_status },
                { label: 'Motivo', value: (viewingLesson as any).motivo_falta },
                { label: 'Observacoes', value: (viewingLesson as any).notes },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-black text-gray-400 uppercase">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900 text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setViewingLesson(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Fechar</button>
              {(viewingLesson as any).attendance_status !== 'justificada' && (viewingLesson as any).attendance_status !== 'Justificada' && (
                <button onClick={() => { setMotivoModal({ tipo: 'justificar', lesson: viewingLesson }); setMotivoTexto(''); setMotivoTag(''); }}
                  className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-bold transition-all">Justificar</button>
              )}
              {(viewingLesson as any).attendance_status !== 'falta' && (viewingLesson as any).attendance_status !== 'Ausente' && (
                <button onClick={() => { setMotivoModal({ tipo: 'falta', lesson: viewingLesson }); setMotivoTexto(''); setMotivoTag(''); }}
                  className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">Falta</button>
              )}
              <button onClick={async () => {
                const recGroup = (viewingLesson as any).recurrence_group;
                if (recGroup) {
                  const opcao = window.confirm('Esta aula é recorrente.\n\nOK = Excluir TODAS as recorrentes\nCancelar = Excluir só esta');
                  if (opcao) {
                    await supabase.from('schedules').delete().eq('recurrence_group', recGroup);
                  } else {
                    await supabase.from('schedules').delete().eq('id', viewingLesson.id);
                  }
                } else {
                  if (!confirm('Excluir esta aula?')) return;
                  await supabase.from('schedules').delete().eq('id', viewingLesson.id);
                }
                setViewingLesson(null);
                fetchLessons();
              }} className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">Excluir</button>
              <button onClick={() => { setSelectedLesson(viewingLesson); setEditingLesson({...viewingLesson, time_start: (viewingLesson as any).start_time || viewingLesson.time_start, time_end: (viewingLesson as any).end_time || viewingLesson.time_end}); setViewingLesson(null); }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all">Editar</button>
            </div>
          </div>
        </div>
      )}
      {motivoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">
                {motivoModal.tipo === 'justificar' ? 'Justificar aula' : 'Marcar falta'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{motivoModal.lesson.student_name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Motivo</label>
                <div className="flex flex-wrap gap-2">
                  {['Atestado medico', 'Avisou com antecedencia', 'Faltou sem aviso', 'Compromisso familiar', 'Outro'].map(tag => (
                    <button key={tag} type="button" onClick={() => setMotivoTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${motivoTag === tag ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Observacao (opcional)</label>
                <textarea value={motivoTexto} onChange={e => setMotivoTexto(e.target.value)} rows={3} placeholder="Detalhes adicionais..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setMotivoModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={async () => {
                const lesson = motivoModal.lesson;
                const motivoFinal = motivoTag + (motivoTexto ? (motivoTag ? ' - ' : '') + motivoTexto : '');
                if (motivoModal.tipo === 'justificar') {
                  await supabase.from('schedules').update({ attendance_status: 'justificada', reposicao_pendente: true, motivo_falta: motivoFinal }).eq('id', lesson.id);
                  const teacherEmail = teachers.find(t => t.id === lesson.teacher_id)?.email || '';
                  const { data: profProfile } = await supabase.from('profiles').select('id').eq('email', teacherEmail).single();
                  const notifId = profProfile?.id || lesson.teacher_id;
                  await supabase.from('notifications').insert({
                    user_id: notifId,
                    title: 'Aula justificada pelo admin',
                    message: 'A aula com ' + (lesson.student_name || '') + ' em ' + new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR') + ' foi justificada pelo administrador.',
                    type: 'info', read: false, created_at: new Date().toISOString(),
                  });
                  toast.success('Aula justificada!');
                } else {
                  await supabase.from('schedules').update({ attendance_status: 'falta', status: 'falta_confirmada', motivo_falta: motivoFinal }).eq('id', lesson.id);
                  const teacherEmail = teachers.find(t => t.id === lesson.teacher_id)?.email || '';
                  const { data: profProfile } = await supabase.from('profiles').select('id').eq('email', teacherEmail).single();
                  const notifId = profProfile?.id || lesson.teacher_id;
                  await supabase.from('notifications').insert({
                    user_id: notifId,
                    title: 'Falta registrada pelo admin',
                    message: 'A aula com ' + (lesson.student_name || '') + ' em ' + new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR') + ' foi marcada como falta pelo administrador.',
                    type: 'warning', read: false, created_at: new Date().toISOString(),
                  });
                  toast.success('Falta registrada!');
                }
                setMotivoModal(null);
                setViewingLesson(null);
                fetchLessons();
              }} className={`flex-1 py-3 text-white rounded-xl text-sm font-bold transition-all ${motivoModal.tipo === 'justificar' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'}`}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLesson && editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <h2 className="text-xl font-black text-gray-900">Detalhes da Aula</h2>
              <button onClick={() => { setSelectedLesson(null); setEditingLesson(null); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Data</label>
                  <input type="date" value={editingLesson.date || ""} onChange={e => setEditingLesson((l: any) => ({ ...l, date: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Horário Início</label>
                  <input type="time" value={editingLesson.time_start || ""} onChange={e => setEditingLesson((l: any) => ({ ...l, time_start: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Horário Fim</label>
                  <input type="time" value={editingLesson.time_end || ""} onChange={e => setEditingLesson((l: any) => ({ ...l, time_end: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Sala</label>
                  <input type="text" value={editingLesson.room || ""} onChange={e => setEditingLesson((l: any) => ({ ...l, room: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Ex: Sala 1" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Disciplina</label>
                <input type="text" value={editingLesson.subject || ""} onChange={e => setEditingLesson((l: any) => ({ ...l, subject: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Ex: Matematica" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Professor</label>
                <select value={editingLesson.teacher_id || ""} onChange={e => setEditingLesson((l: any) => ({ ...l, teacher_id: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Selecione...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observacoes / Motivo de alteracao</label>
                <textarea rows={3} value={editingLesson.notes || ""} onChange={e => setEditingLesson((l: any) => ({ ...l, notes: e.target.value }))} placeholder="Ex: Remarcado a pedido do aluno..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setSelectedLesson(null); setEditingLesson(null); }} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={async () => {
                if (!confirm('Excluir esta aula?')) return;
                await supabase.from('schedules').delete().eq('id', selectedLesson!.id);
                setSelectedLesson(null); setEditingLesson(null);
                fetchLessons();
              }} className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">Excluir</button>
              <button onClick={() => { setShowSubstModal(true); if (selectedLesson) checkReposicaoPendente([{ id: (selectedLesson as any).student_id || '', name: selectedLesson.student_name || '' }]); }} className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all">Substituir</button>
              <button onClick={saveEdit} disabled={savingEdit} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">{savingEdit ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
