'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FileUp, Calendar as CalIcon, Download, FileText } from 'lucide-react';
import { downloadAsPDF, downloadAsWord } from '@/lib/exportUtils';

import OperationalKPIs from './OperationalKPIs';
import LiveClassesPanel from './LiveClassesPanel';
import DailyTimeline from './DailyTimeline';
import ClassroomStatus from './ClassroomStatus';
import TeacherSchedule from './TeacherSchedule';
import SchoolCalendar from './SchoolCalendar';

export default function OperationsView() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalToday: 0,
    liveCount: 0,
    occupancyRate: 0,
    activeTeachers: 0,
    presentStudents: 0,
    absences: 0,
    pendingRepositions: 0,
  });

  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [period, setPeriod] = useState<'hoje' | 'semanal' | 'mensal' | 'anual'>('hoje');

  useEffect(() => {
    fetchOperationalData();
  }, []);

  const fetchOperationalData = async () => {
    setLoading(true);
    try {
      // Fetch schedules for today
      const today = new Date().toISOString().split('T')[0];
      const { data: daySchedules, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('date', today);

      if (error) throw error;

      // Mocking some data for visual completeness since real students/rooms/teachers 
      // might be limited in local storage during initial setup
      setStats({
        totalToday: daySchedules?.length || 0,
        liveCount: (daySchedules || []).filter(s => s.status === 'Em andamento').length,
        occupancyRate: 65,
        activeTeachers: 8,
        presentStudents: 42,
        absences: 3,
        pendingRepositions: 2,
      });

      setLiveClasses((daySchedules || []).filter(s => s.status === 'Em andamento').map(s => ({
        id: s.id,
        subject: s.subject,
        teacher_name: s.teacher_name,
        room: s.room || 'S01',
        start_time: s.start_time,
        end_time: s.end_time,
        student_count: 12,
        status: 'em andamento'
      })));

      setTimelineEvents((daySchedules || []).map(s => ({
        id: s.id,
        time: s.start_time,
        title: s.subject,
        responsible: s.teacher_name,
        type: s.class_type || 'Aula Regular',
        duration: `${s.duration || 60}min`,
        notes: s.notes,
        category: s.category || 'individual'
      })));

      // Mock UI data for rooms and teachers status
      setRooms([
        { id: '1', name: 'Sala 01 - Kids', status: 'occupied', currentClass: 'Inglês Interativo', capacity: 15, currentStudents: 12 },
        { id: '2', name: 'Sala 02 - Teens', status: 'free', nextClassTime: '14:00', capacity: 20 },
        { id: '3', name: 'Laboratório', status: 'occupied', currentClass: 'Robótica II', capacity: 10, currentStudents: 8 },
        { id: '4', name: 'Auditório', status: 'maintenance', capacity: 50 },
      ]);

      setTeachers([
        { id: '1', name: 'Ricardo Santos', subject: 'Matemática', status: 'teaching', timeRemaining: '15min' },
        { id: '2', name: 'Carla Lima', subject: 'Português', status: 'available' },
        { id: '3', name: 'Miguel Arraes', subject: 'História', status: 'on-break' },
        { id: '4', name: 'Ana Beatriz', subject: 'Biologia', status: 'teaching', timeRemaining: '40min' },
      ]);

    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados operacionais');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12" id="operations-view-content">
      {/* Top Controls Header */}
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
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                  period === p 
                    ? 'bg-white shadow-sm text-primary scale-100' 
                    : 'text-gray-400 opacity-60 hover:opacity-100 scale-95'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              id="download-pdf-btn"
              onClick={() => {
                const toastId = toast.loading('Gerando PDF...');
                downloadAsPDF('operations-view-content', `Relatorio_Operacional_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`)
                  .then(() => toast.success('PDF baixado com sucesso!', { id: toastId }))
                  .catch(() => toast.error('Erro ao gerar PDF', { id: toastId }));
              }}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 hover:bg-gray-50 text-gray-900 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm hover:scale-[1.02] active:scale-95 group"
            >
              <Download size={16} className="text-primary" />
              Baixar PDF
            </button>
            <button 
              id="download-word-btn"
              onClick={() => {
                const toastId = toast.loading('Gerando Word...');
                const data = {
                  title: 'Relatório Operacional - ' + new Date().toLocaleDateString('pt-BR'),
                  sections: [
                    {
                      title: 'Aulas Ao Vivo',
                      content: liveClasses.map(c => ({
                        Aula: c.subject,
                        Professor: c.teacher_name,
                        Sala: c.room,
                        Inicio: c.start_time,
                        Fim: c.end_time,
                        Alunos: c.student_count
                      }))
                    },
                    {
                      title: 'Status das Salas',
                      content: rooms.map(r => ({
                        Sala: r.name,
                        Status: r.status,
                        Capacidade: r.capacity,
                        Ocupacao: r.currentStudents || 0
                      }))
                    }
                  ]
                };
                downloadAsWord(data, `Relatorio_Operacional_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`)
                  .then(() => toast.success('Word baixado com sucesso!', { id: toastId }))
                  .catch(() => toast.error('Erro ao gerar Word', { id: toastId }));
              }}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 hover:bg-gray-50 text-gray-900 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm hover:scale-[1.02] active:scale-95 group"
            >
              <FileText size={16} className="text-blue-500" />
              Baixar Word
            </button>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 group">
            <FileUp size={16} className="group-hover:animate-bounce" />
            Importar Documentos
          </button>
        </div>
      </div>

      {/* KPIs Section */}
      <OperationalKPIs stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Operational Dashboard Row */}
        <div className="lg:col-span-4 space-y-8">
          <LiveClassesPanel classes={liveClasses} />
          <ClassroomStatus rooms={rooms} />
        </div>

        <div className="lg:col-span-5">
          <DailyTimeline events={timelineEvents} />
        </div>

        <div className="lg:col-span-3">
          <TeacherSchedule teachers={teachers} />
        </div>
      </div>

      {/* Full Width Calendar Section */}
      <SchoolCalendar />
    </div>
  );
}
