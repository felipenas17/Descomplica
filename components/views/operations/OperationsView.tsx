'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FileUp, Calendar as CalIcon } from 'lucide-react';

import OperationalKPIs from './OperationalKPIs';
import LiveClassesPanel from './LiveClassesPanel';
import DailyTimeline from './DailyTimeline';
import ClassroomStatus from './ClassroomStatus';
import TeacherSchedule from './TeacherSchedule';
import SchoolCalendar from './SchoolCalendar';

export default function OperationsView() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalToday: 0, liveCount: 0, occupancyRate: 0,
    activeTeachers: 0, presentStudents: 0, absences: 0, pendingRepositions: 0,
  });
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [period, setPeriod] = useState<'hoje' | 'semanal' | 'mensal' | 'anual'>('hoje');

  useEffect(() => { fetchOperationalData(); }, []);

  const fetchOperationalData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: daySchedules } = await supabase.from('schedules').select('*').eq('date', today);
      const { data: roomsData } = await supabase.from('rooms').select('*');
      const { data: teachersData } = await supabase.from('teachers').select('*');

      const schedules = daySchedules || [];
      setStats({
        totalToday: schedules.length,
        liveCount: schedules.filter(s => s.status === 'Em andamento').length,
        occupancyRate: 0, activeTeachers: teachersData?.length || 0,
        presentStudents: 0, absences: 0, pendingRepositions: 0,
      });
      setLiveClasses(schedules.filter(s => s.status === 'Em andamento'));
      setTimelineEvents(schedules.map(s => ({
        id: s.id, time: s.start_time, title: s.subject,
        responsible: s.teacher_name, type: s.class_type || 'Aula Regular',
        duration: `${s.duration || 60}min`, notes: s.notes, category: s.category || 'individual'
      })));
      setRooms(roomsData || []);
      setTeachers(teachersData || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados operacionais');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <CalIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-display font-black text-gray-900 leading-tight">Painel Operacional</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Controle de Fluxo Escolar</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            {(['hoje', 'semanal', 'mensal', 'anual'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${period === p ? 'bg-white shadow-sm text-primary scale-100' : 'text-gray-400 opacity-60 hover:opacity-100 scale-95'}`}>
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl">
            <FileUp size={16} />
            Importar Documentos
          </button>
        </div>
      </div>
      <OperationalKPIs stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <LiveClassesPanel classes={liveClasses} />
          <ClassroomStatus rooms={rooms} />
        </div>
        <div className="lg:col-span-5"><DailyTimeline events={timelineEvents} /></div>
        <div className="lg:col-span-3"><TeacherSchedule teachers={teachers} /></div>
      </div>
      <SchoolCalendar />
    </div>
  );
}
