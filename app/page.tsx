'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppContainer, type View } from '@/components/AppContainer';
import Login from '@/components/Login';
import QuickActionModal from '@/components/QuickActionModal';
import DashboardView from '@/components/views/DashboardView';
import ScheduleView from '@/components/views/ScheduleView';
import FinanceView from '@/components/views/FinanceView';
import TeachersView from '@/components/views/TeachersView';
import StudentsView from '@/components/views/StudentsView';
import AgendaView from '@/components/views/AgendaView';
import FeedbacksView from '@/components/views/FeedbacksView';
import UsersView from '@/components/views/UsersView';
import MaterialsView from '@/components/views/MaterialsView';
import PasswordChangeModal from '@/components/modals/PasswordChangeModal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const INITIAL_SCHEDULE = [
  { id: '1', title: 'Matemática Avançada', subject: 'Matemática Avançada', day: 'SEG', startTime: '14:00', endTime: '15:40', room: 'A01', teacherName: 'Ricardo Almeida', studentName: 'Lucas Ferreira', isTestWeek: true, status: 'Confirmado' },
  { id: '2', title: 'Física Térmica', subject: 'Física Térmica', day: 'SEG', startTime: '16:00', endTime: '17:40', room: 'B04', teacherName: 'Ricardo Almeida', studentName: 'Mariana Duarte', isTestWeek: false, status: 'Confirmado' },
  { id: '3', title: 'Química Orgânica', subject: 'Química Orgânica', day: 'TER', startTime: '08:00', endTime: '09:40', room: 'C02', teacherName: 'Sandra Mendes', studentName: 'Roberto Júnio', isTestWeek: true, status: 'Pendente' },
  { id: '4', title: 'Geometria Analítica', subject: 'Geometria Analítica', day: 'QUA', startTime: '14:00', endTime: '15:40', room: 'A01', teacherName: 'Ricardo Almeida', studentName: 'Clara Meireles', isTestWeek: false, status: 'Confirmado' },
];

function getDayFromDate(dateStr: string) {
  const DAYS_MAP = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const d = new Date(dateStr + 'T00:00:00');
  return DAYS_MAP[d.getDay()];
}

export default function Home() {
  const [user, setUser] = useState<{ role: 'admin' | 'professor', name: string, email?: string, id?: string } | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [schedule, setSchedule] = useState<any[]>(INITIAL_SCHEDULE);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchSchedule = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.warn('[Home] Supabase não configurado. Utilizando dados fictícios.');
      setSchedule(INITIAL_SCHEDULE);
      return;
    }

    try {
      console.log('[Home] Buscando horários do Supabase...');
      const { data, error: supabaseError } = await supabase
        .from('schedules')
        .select('*')
        .order('date', { ascending: true });
      
      if (supabaseError) {
        console.error('[Home] Erro ao buscar horários:', JSON.stringify(supabaseError, null, 2));
        // Fallback para dados mock em caso de erro de configuração/tabela
        setSchedule(INITIAL_SCHEDULE);
        return;
      }
      
      if (data && data.length > 0) {
        console.log(`[Home] ${data.length} horários carregados.`);
        const mapped = data.map((item: any) => ({
          id: item.id,
          title: item.subject,
          subject: item.subject,
          studentName: item.student_name,
          teacherName: item.teacher_name,
          teacher_email: item.teacher_email,
          teacher_id: item.teacher_id,
          date: item.date,
          day: getDayFromDate(item.date),
          startTime: item.start_time,
          endTime: item.end_time,
          duration: item.duration,
          room: 'A01', 
          isTestWeek: item.is_test_week,
          status: item.status,
          type: item.class_type,
          notes: item.notes
        }));
        setSchedule(mapped);
      } else {
        console.warn('[Home] Nenhum horário encontrado. Usando mock data.');
        setSchedule(INITIAL_SCHEDULE);
      }
    } catch (err: any) {
      console.error('[Home] Erro inesperado no fetchSchedule:', err);
      setSchedule(INITIAL_SCHEDULE);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (active) fetchSchedule();
    return () => { active = false; };
  }, [fetchSchedule]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  React.useEffect(() => {
    const handlePlusClick = () => setIsModalOpen(true);
    window.addEventListener('global-plus-click', handlePlusClick);
    return () => window.removeEventListener('global-plus-click', handlePlusClick);
  }, []);

  if (!user) {
    return <Login onLogin={(u: any) => {
      setUser(u);
      setActiveView(u.role === 'professor' ? 'agenda' : 'dashboard');
      if (u.needs_password_change) {
        setShowPasswordChange(true);
      }
    }} />;
  }

  const addScheduleEvent = (newEvent: any) => {
    fetchSchedule();
    notify('Aula agendada com sucesso! ✅');
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'schedule': return <ScheduleView schedule={schedule} onAddEvent={(ev: any) => { addScheduleEvent(ev); fetchSchedule(); }} />;
      case 'finance': return <FinanceView />;
      case 'teachers': return <TeachersView />;
      case 'students': return <StudentsView />;
      case 'agenda': return <AgendaView user={user} schedule={schedule} onRefresh={fetchSchedule} />;
      case 'feedbacks': return <FeedbacksView />;
      case 'users': return <UsersView />;
      case 'materials': return <MaterialsView user={user} />;
      default: return <DashboardView />;
    }
  };

  return (
    <AppContainer 
      activeView={activeView} 
      setView={setActiveView} 
      user={user} 
      onLogout={() => setUser(null)}
    >
      <QuickActionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddEvent={addScheduleEvent}
        schedule={schedule}
      />

      <PasswordChangeModal 
        isOpen={showPasswordChange}
        onSuccess={() => {
          setShowPasswordChange(false);
          notify('Senha alterada com sucesso! 🛡️');
        }}
      />
      
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-black text-white px-10 py-5 rounded-[2rem] shadow-2xl font-black text-sm border border-white/10 flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {renderView()}
    </AppContainer>
  );
}
