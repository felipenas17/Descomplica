'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h às 20h

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
}

export default function SchoolCalendar({ user }: { user?: any }) {
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newLesson, setNewLesson] = useState<NewLesson>({
    date: new Date().toISOString().split('T')[0],
    time_start: '08:00', time_end: '09:00',
    subject: '', room: '', teacher_id: '', student_name: '', student_id: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<{id: string, name: string}[]>([]);
  const [students, setStudents] = useState<{id: string, name: string}[]>([]);
  const [dragLesson, setDragLesson] = useState<Lesson | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [teacherAvailability, setTeacherAvailability] = useState<any>(null);
  const [teacherBusySlots, setTeacherBusySlots] = useState<any[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ newDate: '', newTime: '', reason: '' });

  const fetchTeachersAndStudents = async () => {
    const [teachersRes, studentsRes] = await Promise.all([
      supabase.from('teachers').select('id, name').order('name'),
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

  useEffect(() => { fetchLessons(); fetchTeachersAndStudents(); }, [currentDate, view]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      let query = supabase.from('schedules').select('*').order('date').order('time_start');
      if (!isAdmin && user?.id) query = query.eq('teacher_id', user.id);

      const start = getViewStart();
      const end = getViewEnd();
      if (start && end) {
        query = query.gte('date', start).lte('date', end);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLessons(data || []);
    } catch (e) { setLessons([]); } finally { setLoading(false); }
  };

  const getViewStart = () => {
    const d = new Date(currentDate);
    if (view === 'day') return d.toISOString().split('T')[0];
    if (view === 'week') {
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split('T')[0];
    }
    if (view === 'month') return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    if (view === 'year') return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0];
    return null;
  };

  const getViewEnd = () => {
    const d = new Date(currentDate);
    if (view === 'day') return d.toISOString().split('T')[0];
    if (view === 'week') {
      d.setDate(d.getDate() - d.getDay() + 6);
      return d.toISOString().split('T')[0];
    }
    if (view === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    if (view === 'year') return new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0];
    return null;
  };

  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'year') d.setFullYear(d.getFullYear() + dir);
    setCurrentDate(d);
  };

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
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
    const dateStr = date.toISOString().split('T')[0];
    return lessons.filter(l => l.date === dateStr);
  };

  const getLessonColor = (lesson: Lesson, idx: number) => COLORS[idx % COLORS.length];

  const getLessonTop = (timeStart: string) => {
    const [h, m] = timeStart.split(':').map(Number);
    return ((h - 7) * 80) + (m / 60 * 80);
  };

  const getLessonHeight = (timeStart: string, timeEnd: string) => {
    const [sh, sm] = timeStart.split(':').map(Number);
    const [eh, em] = timeEnd.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max(mins / 60 * 80, 40);
  };

  const saveLesson = async () => {
    if (!newLesson.subject || !newLesson.date) {
      toast.error('Preencha pelo menos a matéria e a data!');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('schedules').insert({
        date: newLesson.date,
        start_time: newLesson.time_start,
        end_time: newLesson.time_end,
        subject: newLesson.subject,
        room: newLesson.room,
        student_name: newLesson.student_name,
        student_id: newLesson.student_id || null,
        teacher_id: newLesson.teacher_id || user?.id || null,
        teacher_name: teachers.find(t => t.id === newLesson.teacher_id)?.name || user?.name || 'Admin',
        notes: newLesson.notes,
        status: 'confirmado',
      });
      if (error) throw error;

      // Notificar o professor selecionado
      const teacherId = newLesson.teacher_id || user?.id || null;
      if (teacherId) {
        const teacherName = teachers.find(t => t.id === teacherId)?.name || 'Professor';
        await supabase.from('notifications').insert({
          user_id: teacherId,
          title: 'Nova aula agendada! 📅',
          message: `Você tem uma nova aula de ${newLesson.subject} marcada para ${newLesson.date} das ${newLesson.time_start} às ${newLesson.time_end}${newLesson.room ? ' na sala ' + newLesson.room : ''}.`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      toast.success('Aula incluída com sucesso! ✅');
      setShowModal(false);
      setNewLesson({ date: new Date().toISOString().split('T')[0], time_start: '08:00', time_end: '09:00', subject: '', room: '', student_name: '', notes: '' });
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
            <div className="grid grid-cols-8 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="p-3 border-r border-gray-100 text-[10px] font-black text-gray-300 text-center">HR</div>
              {weekDays.map((day) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const dayLessons = getLessonsForDate(day);
                return (
                  <div key={day.toISOString()} className="p-3 text-center border-r border-gray-100 last:border-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase">{DAYS_SHORT[day.getDay()]}</p>
                    <p className={`text-lg font-black mt-0.5 ${isToday ? 'w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </p>
                    {dayLessons.length > 0 && <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mx-auto mt-1" />}
                  </div>
                );
              })}
            </div>

            <div className="overflow-y-auto max-h-[600px]">
              <div className="grid grid-cols-8">
                {/* Hours */}
                <div className="flex flex-col">
                  {HOURS.map(h => (
                    <div key={h} className="h-20 border-r border-b border-gray-100 px-2 flex items-start pt-1">
                      <span className="text-[10px] font-black text-gray-300">{h}:00</span>
                    </div>
                  ))}
                </div>

                {/* Days */}
                {weekDays.map((day) => {
                  const dayLessons = getLessonsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div key={day.toISOString()} className={`relative border-r border-gray-100 last:border-0 ${isToday ? 'bg-purple-50/30' : ''}`}>
                      {HOURS.map(h => (
                        <div key={h} className="h-20 border-b border-gray-50 last:border-0" />
                      ))}
                      {dayLessons.map((lesson, idx) => {
                        const color = getLessonColor(lesson, idx);
                        const top = getLessonTop(lesson.time_start || '08:00');
                        const height = getLessonHeight(lesson.time_start || '08:00', lesson.time_end || '09:00');
                        return (
                          <div key={lesson.id}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            onClick={() => { setSelectedLesson(lesson); setEditingLesson({...lesson}); }} className={`absolute left-1 right-1 ${color.bg} border-l-4 ${color.border} rounded-xl p-1.5 z-10 overflow-hidden cursor-pointer hover:shadow-md transition-all`}>
                            <p className={`text-[9px] font-black uppercase ${color.text}`}>{lesson.subject}</p>
                            {lesson.room && <p className="text-[9px] text-gray-500 truncate">🏫 {lesson.room}</p>}
                            {lesson.teacher_name && <p className="text-[9px] text-gray-500 truncate">👤 {lesson.teacher_name}</p>}
                            {lesson.student_name && <p className="text-[9px] text-gray-500 truncate">🎓 {lesson.student_name}</p>}
                            {lesson.room && <p className="text-[9px] text-gray-500 truncate">{lesson.room}</p>}
                            {lesson.time_start && <p className="text-[9px] text-gray-400">{lesson.time_start}</p>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
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
                  {HOURS.map(h => <div key={h} className="h-20 border-r border-b border-gray-100 px-2 flex items-start pt-1"><span className="text-[10px] font-black text-gray-300">{h}:00</span></div>)}
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
                        <div className="flex flex-wrap gap-3 mt-1">
                          {lesson.time_start && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={10} />{lesson.time_start} - {lesson.time_end}</span>}
                          {lesson.room && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={10} />{lesson.room}</span>}
                          {lesson.student_name && <span className="flex items-center gap-1 text-xs text-gray-500"><User size={10} />{lesson.student_name}</span>}
                        </div>
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
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Matéria *</label>
                <input value={newLesson.subject} onChange={e => setNewLesson(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Ex: Matemática, Inglês..."
                  className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

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
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Aluno</label>
                <select
                  value={newLesson.student_id}
                  onChange={e => {
                    const student = students.find(s => s.id === e.target.value);
                    setNewLesson(p => ({ ...p, student_id: e.target.value, student_name: student?.name || '' }));
                  }}
                  className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="">Selecionar aluno...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Data *</label>
                  <input type="date" value={newLesson.date} onChange={e => {
                    setNewLesson(p => ({ ...p, date: e.target.value }));
                    fetchTeacherAvailability(newLesson.teacher_id, e.target.value);
                  }}
                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
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
                  <input type="date" value={editingLesson.date || ""} onChange={e => setEditingLesson((l) => ({ ...l, date: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Horário Início</label>
                  <input type="time" value={editingLesson.time_start || ""} onChange={e => setEditingLesson((l) => ({ ...l, time_start: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Horário Fim</label>
                  <input type="time" value={editingLesson.time_end || ""} onChange={e => setEditingLesson((l) => ({ ...l, time_end: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Sala</label>
                  <input type="text" value={editingLesson.room || ""} onChange={e => setEditingLesson((l) => ({ ...l, room: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Ex: Sala 1" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Disciplina</label>
                <input type="text" value={editingLesson.subject || ""} onChange={e => setEditingLesson((l) => ({ ...l, subject: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Ex: Matematica" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Professor</label>
                <select value={editingLesson.teacher_id || ""} onChange={e => setEditingLesson((l) => ({ ...l, teacher_id: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">Selecione...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Observacoes / Motivo de alteracao</label>
                <textarea rows={3} value={editingLesson.notes || ""} onChange={e => setEditingLesson((l) => ({ ...l, notes: e.target.value }))} placeholder="Ex: Remarcado a pedido do aluno..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setSelectedLesson(null); setEditingLesson(null); }} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={saveEdit} disabled={savingEdit} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">{savingEdit ? "Salvando..." : "Salvar Alteracoes"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
