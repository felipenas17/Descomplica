'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  MapPin, 
  AlertCircle,
  TrendingUp,
  Calendar as CalendarIcon,
  Zap,
  MoreVertical,
  X,
  CheckCircle,
  BarChart3,
  Lightbulb,
  MousePointer2
} from 'lucide-react';

// Mock expanded schedule data
const INITIAL_EVENTS = [
  { 
    id: '1', 
    title: 'Matemática Avançada', 
    day: 'SEG', 
    startTime: '14:00', 
    endTime: '15:40', 
    room: 'A01', 
    teacher: 'Ricardo Santos', 
    student: 'Lucas Ferreira', 
    type: 'individual',
    status: 'confirmado',
    subject: 'Exatas',
    isTestWeek: true
  },
  { 
    id: '2', 
    title: 'Física Térmica', 
    day: 'SEG', 
    startTime: '14:00', 
    endTime: '15:40', 
    room: 'B04', 
    teacher: 'Ricardo Santos', 
    student: 'Mariana Duarte', 
    type: 'individual',
    status: 'conflito', 
    subject: 'Exatas',
    isTestWeek: false
  },
  { 
    id: '3', 
    title: 'Química Orgânica', 
    day: 'TER', 
    startTime: '08:00', 
    endTime: '10:00', 
    room: 'C02', 
    teacher: 'Elena Costa', 
    student: 'Grupo 3B', 
    type: 'grupo',
    status: 'confirmado',
    subject: 'Biomédicas'
  },
  { 
    id: '4', 
    title: 'Redação ENEM', 
    day: 'QUA', 
    startTime: '16:00', 
    endTime: '17:30', 
    room: 'D01', 
    teacher: 'Marco Aurélio', 
    student: 'Clara Meireles', 
    type: 'individual',
    status: 'pendente',
    subject: 'Humanas'
  },
  { 
    id: '5', 
    title: 'Literatura', 
    day: 'SEG', 
    startTime: '09:00', 
    endTime: '10:30', 
    room: 'D01', 
    teacher: 'Elena Costa', 
    student: 'Felipe Neves', 
    type: 'individual',
    status: 'confirmado',
    subject: 'Humanas'
  },
];

const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

const STATUS_COLORS: Record<string, string> = {
  confirmado: 'bg-green-500',
  pendente: 'bg-yellow-500',
  cancelado: 'bg-red-400',
  conflito: 'bg-red-600',
};

const SUBJECT_COLORS: Record<string, string> = {
  'Exatas': 'bg-primary',
  'Biomédicas': 'bg-secondary',
  'Humanas': 'bg-purple-500',
};

interface ScheduleViewProps {
  schedule?: any[];
  onAddEvent?: (event: any) => void;
}

export default function ScheduleView({ schedule = [], onAddEvent }: ScheduleViewProps) {
  const [viewType, setViewType] = useState<'weekly' | 'daily' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [filterTeacher, setFilterTeacher] = useState('Todos');
  const [showGestorMode, setShowGestorMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Date Navigation Helpers
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewType === 'monthly') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    startOfWeek.setDate(diff);

    return DAYS.map((name, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return { name, date: d.getDate(), fullDate: d };
    });
  };

  const weekDays = getWeekDays();
  const currentMonthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
  const currentYear = currentDate.getFullYear();

  const kpis = {
    occupancy: '78%',
    freeSlots: 12,
    monthlyTotal: schedule.length + 320,
    absents: '4.2%'
  };

  const eventsWithConflicts = useMemo(() => {
    return schedule.map(event => {
      const hasTeacherConflict = schedule.some(other => 
        other.id !== event.id && 
        other.day === event.day && 
        other.teacherName === event.teacherName &&
        ((other.startTime <= event.startTime && other.endTime > event.startTime) ||
         (other.startTime < event.endTime && other.endTime >= event.endTime))
      );
      return { ...event, status: hasTeacherConflict ? 'conflito' : event.status };
    });
  }, [schedule]);

  const filteredEvents = useMemo(() => {
    if (filterTeacher === 'Todos') return eventsWithConflicts;
    return eventsWithConflicts.filter(e => e.teacherName === filterTeacher);
  }, [filterTeacher, eventsWithConflicts]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-primary">Gestão de Horários</h1>
          <p className="text-sm text-gray-500 font-medium">Controle estratégico de pátio e produtividade docente</p>
        </div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-[2rem] border border-primary/5">
            <button 
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center min-w-[150px]">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">{currentMonthName}</p>
              <p className="text-lg font-black text-gray-900 leading-none">{currentYear}</p>
            </div>

            <button 
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl">
            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${viewType === type ? 'bg-white shadow-xl text-primary' : 'text-gray-400 opacity-60'}`}
              >
                {type === 'daily' ? 'Diário' : type === 'weekly' ? 'Semanal' : 'Mensal'}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('global-plus-click'))}
            className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={16} /> Agendar Aula
          </button>

          <button 
            onClick={() => setShowGestorMode(!showGestorMode)}
            className={`p-3 rounded-2xl transition-all ${showGestorMode ? 'bg-black text-white' : 'bg-primary/5 text-primary'}`}
            title={showGestorMode ? 'Modo Agenda' : 'Modo Gestor'}
          >
            <BarChart3 size={20} />
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Taxa de Ocupação', value: kpis.occupancy, sub: '+4% vs mês ant.', color: 'text-primary', icon: TrendingUp },
          { label: 'Horários Livres/Dia', value: kpis.freeSlots, sub: 'Média na semana', color: 'text-secondary', icon: CalendarIcon },
          { label: 'Aulas no Mês', value: kpis.monthlyTotal, sub: 'Ciclo Vigente', color: 'text-blue-500', icon: Users },
          { label: 'Faltas / Ociosidade', value: kpis.absents, sub: 'Meta: < 3%', color: 'text-red-500', icon: AlertCircle },
        ].map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-[2rem] border border-primary/5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-gray-50 ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</span>
            </div>
            <p className="text-3xl font-display font-black text-gray-900">{kpi.value}</p>
            <p className="text-[10px] font-bold text-gray-400 mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </section>

      {showGestorMode ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card p-10 rounded-[2.5rem] border border-primary/5 bg-primary/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8"><Zap className="text-primary opacity-20" size={120} /></div>
               <h2 className="text-2xl font-display font-black text-primary mb-2 flex items-center gap-3">
                 <MousePointer2 className="animate-bounce" /> Heatmap de Ocupação
               </h2>
               <p className="text-sm text-gray-500 max-w-md">O período da tarde (16h-18h) concentra 85% da sua demanda semanal. Considere remanejar tutores para estes horários.</p>
               
               <div className="mt-10 grid grid-cols-6 gap-2">
                 {DAYS.map(d => (
                   <div key={d} className="space-y-2">
                     <p className="text-center text-[10px] font-black text-gray-400 uppercase">{d}</p>
                     <div className="h-40 w-full bg-white rounded-2xl border border-primary/5 p-1 flex flex-col gap-1">
                        <div className="flex-1 bg-primary rounded-xl opacity-90"></div>
                        <div className="flex-1 bg-primary rounded-xl opacity-60"></div>
                        <div className="flex-1 bg-primary rounded-xl opacity-20"></div>
                        <div className="flex-1 bg-white rounded-xl"></div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-8 rounded-[2rem] border border-secondary/20 shadow-xl shadow-secondary/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                    <Lightbulb size={24} />
                  </div>
                  <h3 className="font-display font-black text-gray-900 leading-tight">Insight da IA</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 bg-white/50 p-4 rounded-2xl border border-primary/5 italic">
                    &quot;O professor <span className="font-bold text-primary">Ricardo</span> está com baixa ocupação na Terça-feira. Sugiro abrir 3 slots para reforço de Cálculo.&quot;
                  </p>
                  <button 
                    onClick={() => notify('🔍 Otimizando grade horária... Sucesso! 3 conflitos resolvidos.')}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-lg"
                  >
                    Otimizar Agenda Agora
                  </button>
                </div>
              </div>

              <div className="glass-card p-8 rounded-[2rem] border border-primary/5">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Carga Horária / Professor</h4>
                <div className="space-y-4">
                  {[
                    { name: 'Ricardo Santos', h: 32, total: 40, color: 'bg-primary' },
                    { name: 'Elena Costa', h: 18, total: 40, color: 'bg-secondary' },
                    { name: 'Sandra Mendes', h: 38, total: 40, color: 'bg-red-400' },
                  ].map(p => (
                    <div key={p.name} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase">
                         <span>{p.name}</span>
                         <span className="text-primary">{p.h}h / {p.total}h</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                         <div className={`h-full ${p.color}`} style={{ width: `${(p.h/p.total)*100}%` }}></div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <section className="flex flex-wrap gap-4 items-center bg-gray-50/50 p-4 rounded-3xl border border-primary/5">
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-primary/10 shadow-sm grow md:grow-0">
              <Filter size={16} className="text-gray-400" />
              <select 
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 p-0 pr-8"
              >
                <option>Todos</option>
                <option>Ricardo Santos</option>
                <option>Elena Costa</option>
                <option>Marco Aurélio</option>
              </select>
            </div>

            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-primary/10 shadow-sm grow md:grow-0">
              <Users size={16} className="text-gray-400" />
              <select className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 p-0 pr-8">
                <option>Todo Tipo de Aula</option>
                <option>Individual</option>
                <option>Grupo</option>
              </select>
            </div>

            <div className="flex-1 md:flex-none flex items-center bg-white px-5 py-3 rounded-2xl border border-primary/10 shadow-sm">
              <Search size={16} className="text-gray-400" />
              <input placeholder="Buscar aluno..." className="bg-transparent border-none text-sm font-bold focus:ring-0 ml-2" />
            </div>

            <div className="ml-auto hidden xl:flex items-center gap-6 pr-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-black uppercase text-gray-400">Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                <span className="text-[10px] font-black uppercase text-gray-400">Conflito</span>
              </div>
            </div>
          </section>

          <div className="glass-card rounded-[2.5rem] overflow-hidden border border-primary/5 shadow-2xl shadow-primary/5 bg-white">
            <AnimatePresence mode="wait">
              {viewType === 'weekly' ? (
                <motion.div 
                  key="weekly"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="overflow-x-auto custom-scrollbar"
                >
                  <div className="min-w-[1200px]">
                    <div className="grid grid-cols-[100px_repeat(6,1fr)] bg-primary/5 border-b border-primary/5 divide-x divide-primary/5">
                      <div className="flex items-center justify-center border-r border-primary/10">
                        <span className="text-[10px] font-black text-primary opacity-40">HORA</span>
                      </div>
                      {weekDays.map((d, idx) => (
                        <div key={d.name} className="p-6 text-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{d.name}</p>
                          <p className={`text-4xl font-display font-black mt-2 ${idx === 0 ? 'text-primary' : 'text-gray-900'}`}>{d.date}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-[100px_repeat(6,1fr)] bg-white divide-x divide-primary/5">
                      <div className="divide-y divide-primary/5 bg-gray-50/30">
                        {HOURS.map(h => (
                          <div key={h} className="h-32 flex items-start justify-center pt-4 border-r border-primary/5">
                            <span className="text-xs font-black text-gray-400">{h}</span>
                          </div>
                        ))}
                      </div>

                      {DAYS.map(day => (
                        <div key={day} className="relative h-full divide-y divide-primary/5 min-h-[800px]">
                          {HOURS.map(h => <div key={h} className="h-32"></div>)}

                          {filteredEvents.filter(e => e.day === day).map(event => {
                            const startIdx = HOURS.indexOf(event.startTime);
                            const top = startIdx * 128; 
                            const durationInHours = (parseInt(event.endTime.split(':')[0]) - parseInt(event.startTime.split(':')[0])) + (parseInt(event.endTime.split(':')[1]) - parseInt(event.startTime.split(':')[1])) / 60 || 1.5;
                            const height = durationInHours * 128;

                            return (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => setSelectedEvent(event)}
                                className={`absolute left-2 right-2 rounded-2xl p-4 shadow-xl cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden ${SUBJECT_COLORS[event.subject] || 'bg-primary'}`}
                                style={{ 
                                  top: `${top + 8}px`, 
                                  height: `${height - 16}px`, 
                                  zIndex: event.status === 'conflito' ? 20 : 10 
                                }}
                              >
                                <div className={`absolute top-0 right-0 w-2 h-full ${STATUS_COLORS[event.status] || 'bg-gray-400'}`}></div>
                                
                                <div className="flex justify-between items-start text-white">
                                  <span className="text-[10px] font-black opacity-80 uppercase tracking-widest">{event.startTime} - {event.endTime}</span>
                                  {event.status === 'conflito' && <AlertCircle size={14} className="text-white animate-pulse" />}
                                </div>

                                <h4 className="text-white font-black text-lg mt-1 group-hover:underline leading-tight">{event.title}</h4>
                                <p className="text-white/80 text-[10px] font-bold mt-2 flex items-center gap-2">
                                  <Users size={12} /> {event.studentName}
                                </p>
                                
                                {event.isTestWeek && (
                                  <div className="mt-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit">
                                    <span className="text-[8px] font-black text-white uppercase flex items-center gap-1">
                                      🚨 Prova
                                    </span>
                                  </div>
                                )}
                                
                                {event.status === 'conflito' && (
                                  <div className="absolute inset-0 bg-red-600/10 backdrop-blur-[1px] border-2 border-dashed border-white/40 rounded-2xl flex items-center justify-center pointer-events-none">
                                    <span className="text-white font-black text-[10px] uppercase rotate-12 bg-red-600 px-3 py-1 rounded-full shadow-lg">CONFLITO</span>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : viewType === 'daily' ? (
                <motion.div 
                  key="daily"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 space-y-6"
                >
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-2xl font-display font-black text-primary">Agenda do Dia: Segunda-feira</h3>
                     <span className="px-4 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">HOJE</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {filteredEvents.filter(e => e.day === 'SEG').map(event => (
                      <div key={event.id} onClick={() => setSelectedEvent(event)} className="flex items-center gap-8 p-6 glass-card rounded-3xl border border-primary/5 hover:bg-primary/5 transition-all cursor-pointer">
                        <div className="w-24 text-center border-r border-primary/10 pr-8">
                           <p className="text-sm font-black text-primary">{event.startTime}</p>
                           <p className="text-[10px] font-bold text-gray-400">{event.endTime}</p>
                        </div>
                        <div className="flex-1">
                           <h4 className="text-lg font-black text-gray-900">{event.title}</h4>
                           <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Users size={14} /> {event.studentName}</span>
                              <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><MapPin size={14} /> Sala {event.room}</span>
                           </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${STATUS_COLORS[event.status]} text-white`}>
                           {event.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="monthly"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-8"
                >
                  <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-3xl overflow-hidden border border-primary/5">
                    {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
                       <div key={d} className="bg-primary/5 p-4 text-center">
                          <span className="text-[10px] font-black text-primary opacity-60">{d}</span>
                       </div>
                    ))}
                    {(() => {
                      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                      const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
                      const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                      
                      return [...blanks.map(b => (
                        <div key={`blank-${b}`} className="bg-gray-50/50 min-h-[120px] p-4"></div>
                      )), ...monthDays.map(day => (
                        <div key={`day-${day}`} className="bg-white min-h-[120px] p-4 hover:bg-gray-50 transition-colors group">
                          <span className="text-sm font-black text-gray-300 group-hover:text-primary transition-colors">{day}</span>
                          <div className="mt-2 space-y-1">
                             {day === 12 && (
                               <div className="text-[8px] font-black bg-primary text-white p-1 rounded-lg truncate">4 Aulas</div>
                             )}
                             {day === 15 && (
                               <div className="text-[8px] font-black bg-secondary text-black p-1 rounded-lg truncate">Semana Prova</div>
                             )}
                          </div>
                        </div>
                      ))];
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 rounded-2xl shadow-2xl z-[200] font-bold border border-white/10"
          >
            {notification}
          </motion.div>
        )}
        {selectedEvent && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className={`h-4 ${STATUS_COLORS[selectedEvent.status] || 'bg-primary'}`}></div>
              <div className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">{selectedEvent.subject}</span>
                    <h2 className="text-4xl font-display font-black text-gray-900 leading-tight">{selectedEvent.title}</h2>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="p-4 hover:bg-gray-100 rounded-2xl transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/5 rounded-2xl text-primary"><Users size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Estudante</p>
                        <p className="font-bold text-gray-900">{selectedEvent.studentName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-secondary/10 rounded-2xl text-secondary"><Clock size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Horário</p>
                        <p className="font-bold text-gray-900">{selectedEvent.startTime} — {selectedEvent.endTime}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><CheckCircle size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Professor</p>
                        <p className="font-bold text-gray-900">{selectedEvent.teacherName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><MapPin size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Sala</p>
                        <p className="font-bold text-gray-900">Sala {selectedEvent.room}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedEvent.status === 'conflito' && (
                  <div className="mb-10 p-6 bg-red-50 rounded-[2rem] border border-red-200 flex items-start gap-4">
                    <AlertCircle className="text-red-500 shrink-0" size={24} />
                    <div className="space-y-1">
                      <p className="text-sm font-black text-red-600 uppercase tracking-widest">Alerta de Conflito</p>
                      <p className="text-xs font-bold text-red-500">Professor ocupado em outra sala neste horário.</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      notify('Iniciando fluxo de reagendamento inteligente...');
                      setSelectedEvent(null);
                    }}
                    className="flex-1 py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Reagendar
                  </button>
                  <button 
                    onClick={() => {
                      notify('Aula cancelada. O horário foi liberado na agenda.');
                      setSelectedEvent(null);
                    }}
                    className="flex-1 py-5 border-2 border-primary/20 text-primary rounded-2xl font-black hover:bg-primary/5 transition-all"
                  >
                    Cancelar
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
