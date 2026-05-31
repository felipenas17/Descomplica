'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppContainer, type View } from '@/components/AppContainer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Login from '@/components/Login';
import QuickActionModal from '@/components/QuickActionModal';
import DashboardView from '@/components/views/DashboardView';
import ScheduleView from '@/components/views/ScheduleView';
import TeacherScheduleView from '@/components/views/TeacherScheduleView';
import FinanceView from '@/components/views/FinanceView';
import TeachersView from '@/components/views/TeachersView';
import StudentsView from '@/components/views/StudentsView';
import OperationsView from '@/components/views/operations/OperationsView';
import FeedbacksView from '@/components/views/FeedbacksView';
import UsersView from '@/components/views/UsersView';
import MaterialsView from '@/components/views/MaterialsView';
import NotificationsView from '@/components/views/NotificationsView';
import AbsencesView from '@/components/views/AbsencesView';
import ContractsView from '@/components/views/ContractsView';
import TeacherFeedbacksView from '@/components/views/TeacherFeedbacksView';
import TeacherEvaluationsView from '@/components/views/TeacherEvaluationsView';
import TeacherContractsView from '@/components/views/TeacherContractsView';
import AdminAgendaView from '@/components/views/AdminAgendaView';
import MessagesView from '@/components/views/MessagesView';
import AssistantView from '@/components/views/AssistantView';
import PasswordChangeModal from '@/components/modals/PasswordChangeModal';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import UserProfileModal from '@/components/modals/UserProfileModal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Schedule } from '@/types';

const INITIAL_SCHEDULE: Partial<Schedule>[] = [
  { id: '1', subject: 'Matemática Avançada', teacher_name: 'Ricardo Almeida', student_name: 'Lucas Ferreira', is_test_week: true, status: 'Confirmado' },
  { id: '2', subject: 'Física Térmica', teacher_name: 'Ricardo Almeida', student_name: 'Mariana Duarte', is_test_week: false, status: 'Confirmado' },
  { id: '3', subject: 'Química Orgânica', teacher_name: 'Sandra Mendes', student_name: 'Roberto Júnio', is_test_week: true, status: 'Pendente' },
  { id: '4', subject: 'Geometria Analítica', teacher_name: 'Ricardo Almeida', student_name: 'Clara Meireles', is_test_week: false, status: 'Confirmado' },
];

function getDayFromDate(dateStr: string) {
  const DAYS_MAP = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const d = new Date(dateStr + 'T00:00:00');
  return DAYS_MAP[d.getDay()];
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<{ role: 'admin' | 'professor', name: string, email?: string, id?: string, needs_password_change?: boolean } | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showManualPasswordChange, setShowManualPasswordChange] = useState(false);
  const [schedule, setSchedule] = useState<any[]>(INITIAL_SCHEDULE);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Check for existing session
    async function getSession() {
      if (!isSupabaseConfigured) return;
      
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            role: profile.role,
            name: profile.full_name || 'Usuário',
            needs_password_change: profile.needs_password_change || false
          });
          setActiveView(profile.role === 'professor' ? 'agenda' : 'dashboard');

          if (profile.role === 'admin') {
            const today = new Date();
            const { data: birthdayStudents } = await supabase
              .from('students')
              .select('id, name, birth_date')
              .not('birth_date', 'is', null);

            for (const student of (birthdayStudents || [])) {
              if (!student.birth_date) continue;
              const parts = student.birth_date.split('-');
              const bdMonth = parseInt(parts[1]);
              const bdDay = parseInt(parts[2]);
              const bdThisYear = new Date(today.getFullYear(), bdMonth - 1, bdDay);
              const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const diffDays = Math.round((bdThisYear.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 0 || diffDays > 5) continue;
              const title = diffDays === 0 ? '🎂 Aniversário HOJE!' : '🎂 Aniversário em ' + diffDays + ' dia(s)!';
              const message = diffDays === 0
                ? student.name + ' faz aniversário HOJE! Não esqueça de parabenizar! 🎉'
                : student.name + ' faz aniversário em ' + diffDays + ' dia(s)! Hora de planejar! 🎂';
              const todayStr = todayMidnight.toISOString().split('T')[0];
              const { data: existing } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', profile.id)
                .ilike('message', '%' + student.name + '%')
                .gte('created_at', todayStr)
                .limit(1);
              if (!existing || existing.length === 0) {
                await supabase.from('notifications').insert({
                  user_id: profile.id,
                  title,
                  message,
                  type: 'info',
                  read: false,
                  created_at: new Date().toISOString(),
                });
              }
            }
          }

        } else {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email,
            role: (supabaseUser.user_metadata?.role as any) || 'admin',
            name: supabaseUser.user_metadata?.full_name || 'Usuário',
            needs_password_change: supabaseUser.user_metadata?.needs_password_change || false
          });
          setActiveView((supabaseUser.user_metadata?.role as any) === 'professor' ? 'agenda' : 'dashboard');
        }
      }
    }
    
    getSession();
  }, []);


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

  if (!isMounted) return null;

  if (!user) {
    return <Login onLogin={(u: any) => {
      setUser(u);
      setActiveView(u.role === 'professor' ? 'agenda' : 'dashboard');
      if (u.needs_password_change) {
        setShowPasswordChange(true);
      }
    }} />;
  }

  const addScheduleEvent = () => {
    fetchSchedule();
    notify('Aula agendada com sucesso! ✅');
  };

  const renderView = () => {
    return (
      <ErrorBoundary>
        {(() => {
          switch (activeView) {
            case 'dashboard': return <DashboardView />;
            case 'schedule': return <OperationsView />;
            case 'finance': return <FinanceView />;
            case 'teachers': return <TeachersView />;
            case 'students': return <StudentsView />;
            case 'agenda': return user?.role === 'professor' ? <TeacherScheduleView user={user} /> : <AdminAgendaView user={user} />;
            case 'assistant': return user?.role === 'admin' ? <AssistantView user={user} /> : null;
            case 'feedbacks': return <FeedbacksView />;
            case 'users': return <UsersView />;
            case 'materials': return <MaterialsView userRole={user?.role === 'professor' ? 'teacher' : user?.role as 'admin' | 'teacher'} userId={user?.id || ''} />;
            case 'notifications': return <NotificationsView user={user} />;
            case 'absences': return <AbsencesView />;
            case 'contracts': return <ContractsView />;
            case 'teacher_feedbacks': return <TeacherFeedbacksView user={user} />;
            case 'teacher_evaluations': return <TeacherEvaluationsView />;
            case 'teacher_contracts': return <TeacherContractsView />;
            case 'messages': return <MessagesView user={user} />;
            default: return <DashboardView />;
          }
        })()}
      </ErrorBoundary>
    );
  };

  return (
    <AppContainer 
      activeView={activeView} 
      setView={setActiveView} 
      user={user} 
      onLogout={() => setUser(null)}
      onOpenChangePassword={() => setShowManualPasswordChange(true)}
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

      <UserProfileModal
        isOpen={showManualPasswordChange}
        onClose={() => setShowManualPasswordChange(false)}
        user={user}
        onUserUpdate={(updated) => setUser(updated)}
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
