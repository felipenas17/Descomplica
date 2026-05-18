'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  MapPin, 
  StickyNote
} from 'lucide-react';
import FeedbackModal from '@/components/FeedbackModal';

export default function AgendaView({ user, schedule = [], onRefresh }: { user?: any, schedule?: any[], onRefresh?: () => void }) {
  const [isClassStarted, setIsClassStarted] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [viewType, setViewType] = useState<'today' | 'weekly'>('weekly');

  // State for attendance
  const [attendance, setAttendance] = useState([
    { id: '1', name: 'Lucas Ferreira', status: 'Presente' },
    { id: '2', name: 'Mariana Duarte', status: 'Agendado' },
    { id: '3', name: 'Roberto Júnio', status: 'Presente' }
  ]);

  const toggleAttendance = (id: string) => {
    setAttendance(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Presente' ? 'Agendado' : 'Presente' };
      }
      return s;
    }));
  };

  const todayDate = new Date();
  const dayNameRaw = todayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '').slice(0, 3);

  // Better filtering logic for professors
  const displayEvents = user?.role === 'professor' 
    ? schedule.filter(e => {
        const teacherMatch = e.teacherName?.toLowerCase().includes(user.name?.toLowerCase()) || 
                           e.teacher_email === user.email || 
                           e.teacher_id === user.id;
        return teacherMatch;
      }) 
    : schedule;

  const todayEvents = displayEvents.filter(e => e.day === dayNameRaw);
  const currentClass = todayEvents[0];

  const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  return (
    <div className="space-y-10 relative pb-10">
      {/* Header with Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-display font-black text-primary">Agenda Acadêmica</h1>
          <p className="text-sm text-gray-500 font-medium">Gestão de aulas e acompanhamento de provas</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setViewType('today')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${viewType === 'today' ? 'bg-white shadow-md text-primary' : 'text-gray-400'}`}
          >
            Hoje
          </button>
          <button 
            onClick={() => setViewType('weekly')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${viewType === 'weekly' ? 'bg-white shadow-md text-primary' : 'text-gray-400'}`}
          >
            Semanal
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewType === 'today' ? (
          <motion.div 
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            {/* Active Class Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* ... (Existing Today View Content) ... */}
              <div className="lg:col-span-8 glass-card p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-primary/5 border border-primary/10">
                <div className="absolute top-0 right-0 p-8">
                  {currentClass?.isTestWeek && (
                    <span className="mr-3 px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-600 border border-red-200">
                      Semana de Prova 🚨
                    </span>
                  )}
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${isClassStarted ? 'bg-secondary text-black' : 'bg-primary/20 text-primary'}`}>
                    {isClassStarted ? 'Em Andamento' : 'Próxima Aula'}
                  </span>
                </div>
                
                <div className="max-w-xl">
                  <h1 className="text-4xl font-display font-extrabold text-primary leading-tight">
                    {currentClass?.title || 'Sem aulas no momento'}
                  </h1>
                  <p className="text-lg font-bold text-gray-900 mt-2">Estudante: {currentClass?.studentName || '---'}</p>
                  <div className="mt-6 flex flex-wrap gap-6 text-gray-500">
                    <span className="flex items-center gap-2 font-bold text-sm">
                      <Clock size={16} /> {currentClass ? `${currentClass.startTime} - ${currentClass.endTime}` : '--:--'}
                    </span>
                    <span className="flex items-center gap-2 font-bold text-sm">
                      <MapPin size={16} /> Sala {currentClass?.room || '---'}
                    </span>
                  </div>

                  <div className="mt-12 flex flex-col sm:flex-row gap-4">
                    {currentClass && (
                      <button 
                        onClick={() => {
                          if (isClassStarted) {
                            setSelectedClass({
                              id: currentClass.id,
                              student_name: currentClass.studentName,
                              subject: currentClass.title,
                              teacher_name: currentClass.teacherName,
                              date: currentClass.date || new Date().toISOString().split('T')[0]
                            });
                            setIsFeedbackOpen(true);
                          } else {
                            setIsClassStarted(true);
                          }
                        }}
                        className={`flex-1 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all ${isClassStarted ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-primary text-white shadow-primary/30 hover:scale-105'}`}
                      >
                        {isClassStarted ? <CheckCircle size={24} /> : <Play size={24} fill="currentColor" />}
                        {isClassStarted ? 'Finalizar Aula' : 'Iniciar Aula'}
                      </button>
                    )}
                    <button className="px-8 py-5 rounded-2xl border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all">
                      Material Extra
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 glass-card p-8 rounded-3xl border border-primary/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Notas Rápidas</h3>
                  <StickyNote size={18} className="text-primary" />
                </div>
                <textarea 
                  className="w-full h-48 bg-primary/5 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-secondary resize-none text-gray-700"
                  placeholder="Observações sobre o desempenho do aluno..."
                ></textarea>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div 
            key="weekly"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
          >
            {DAYS.map((day) => {
              const dayEvents = displayEvents.filter(e => e.day === day);
              const isToday = day === dayNameRaw;

              return (
                <div key={day} className={`flex flex-col gap-4 p-4 rounded-3xl border ${isToday ? 'bg-primary/5 border-primary/20' : 'bg-white border-primary/5'}`}>
                  <div className="flex justify-between items-center px-2">
                    <span className={`text-xs font-black tracking-widest ${isToday ? 'text-primary' : 'text-gray-400'}`}>{day}</span>
                    {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>}
                  </div>
                  
                  <div className="space-y-3">
                    {dayEvents.length > 0 ? dayEvents.map(event => (
                      <div key={event.id} className={`p-4 rounded-2xl shadow-sm border ${event.isTestWeek ? 'bg-red-50 border-red-100' : 'bg-white border-primary/5'} hover:scale-[1.02] transition-all cursor-pointer group`}>
                         <p className="text-[9px] font-black text-primary opacity-60 mb-1">{event.startTime}</p>
                         <h4 className="text-xs font-black text-gray-900 leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                         <p className="text-[10px] font-bold text-gray-500 mt-1">{event.studentName}</p>
                         
                         {event.isTestWeek && (
                           <div className="mt-2 text-[8px] font-black text-red-500 bg-red-100/50 px-2 py-1 rounded-full text-center">
                             PROVA 🚨
                           </div>
                         )}
                      </div>
                    )) : (
                      <div className="h-20 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gray-300">Sem aulas</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Attendance section remains here */}
      <section className="mt-12">
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-8">Controle de Presença</h2>
        <div className="glass-card rounded-[2rem] overflow-hidden border border-primary/5 shadow-sm">
          {/* ... (Existing Table) ... */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-primary/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Estudante</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {attendance.map((s) => (
                  <tr key={s.id} className="border-b border-primary/5 hover:bg-gray-50/50">
                    <td className="px-8 py-5 font-bold text-gray-900">{s.name}</td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.status === 'Presente' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                         onClick={() => toggleAttendance(s.id)}
                         className={`p-2 rounded-lg transition-all ${s.status === 'Presente' ? 'bg-secondary/10 text-secondary' : 'hover:bg-primary/5 text-primary'}`}
                       >
                          <CheckCircle size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      {selectedClass && (
        <FeedbackModal 
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          classData={selectedClass}
          onSuccess={() => {
            setIsClassStarted(false);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
