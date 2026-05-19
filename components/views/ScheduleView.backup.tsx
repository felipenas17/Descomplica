'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarCheck, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  CheckCircle2, 
  DollarSign,
  Users,
  CheckCircle,
  Calendar as CalendarIcon,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import AppointmentModal from '@/components/modals/AppointmentModal';

const TYPE_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
  reuniao: { label: 'REUNIÃO', color: 'text-blue-600', bg: 'bg-blue-100' },
  pagamento: { label: 'PAGAMENTO', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  tarefa: { label: 'TAREFA', color: 'text-amber-600', bg: 'bg-amber-100' },
  urgente: { label: 'URGENTE', color: 'text-red-600', bg: 'bg-red-100' },
  outro: { label: 'OUTRO', color: 'text-purple-600', bg: 'bg-purple-100' },
};

const STATUS_CONFIG: Record<string, { label: string, color: string }> = {
  agendado: { label: 'AGENDADO', color: 'bg-gray-100 text-gray-500' },
  confirmado: { label: 'CONFIRMADO', color: 'bg-blue-100 text-blue-600' },
  concluido: { label: 'CONCLUÍDO', color: 'bg-emerald-100 text-emerald-600' },
  cancelado: { label: 'CANCELADO', color: 'bg-red-100 text-red-600' },
  atrasado: { label: 'ATRASADO', color: 'bg-orange-100 text-orange-600' },
};

export default function ScheduleView() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [period, setPeriod] = useState<'hoje' | 'semana' | 'mes'>('hoje');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  // Mini Calendar Logic
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time_start', { ascending: true });

      if (error) throw error;

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const withStatus = data.map((a: any) => {
        const appDate = new Date(a.date);
        appDate.setHours(23, 59, 59, 999); // Final do dia do compromisso
        
        return {
          ...a,
          status: a.status !== 'concluido' && a.status !== 'cancelado' && appDate < now
            ? 'atrasado'
            : a.status
        };
      });

      setAppointments(withStatus);
    } catch (err: any) {
      console.warn('Erro ao buscar appointments ou tabela não existe. Usando Mock.', err.message);
      setIsSupabaseConfigured(false);
      // Fallback para mock
      setAppointments([
        { id: '1', title: 'Reunião com fornecedor de material', type: 'reuniao', date: new Date().toISOString(), time_start: '14:00', time_end: '15:00', responsible: 'Felipe Nas', description: 'Discutir contrato de apostilas para o 2º semestre', status: 'agendado' },
        { id: '2', title: 'Pagamento Aluguel Sala 04', type: 'pagamento', date: new Date().toISOString(), amount: 3500, responsible: 'Financeiro', status: 'confirmado' },
        { id: '3', title: 'Renovar licença softwares', type: 'urgente', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], status: 'atrasado' },
        { id: '4', title: 'Entrevista novo tutor', type: 'reuniao', date: new Date().toISOString(), time_start: '10:00', status: 'concluido' },
        { id: '5', title: 'Ajuste de ar-condicionado', type: 'tarefa', date: new Date().toISOString(), responsible: 'Manutenção', status: 'agendado' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'concluido' })
          .eq('id', id);
        if (error) throw error;
      }
      
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'concluido' } : a));
      toast.success('Compromisso concluído!');
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  const filteredList = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return appointments.filter(a => {
      const aDate = new Date(a.date);
      if (period === 'hoje') {
        return aDate.toDateString() === today.toDateString();
      }
      if (period === 'semana') {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return aDate >= today && aDate <= nextWeek;
      }
      return true; // mes / todos
    }).sort((a, b) => {
      if (a.status === 'concluido' && b.status !== 'concluido') return 1;
      if (a.status !== 'concluido' && b.status === 'concluido') return -1;
      return 0;
    });
  }, [appointments, period]);

  const kpis = useMemo(() => {
    const todayCount = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length;
    const aReceber = appointments
      .filter(a => a.type === 'pagamento' && a.status !== 'concluido')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const reunioes = appointments.filter(a => a.type === 'reuniao' && a.status !== 'concluido').length;
    const concluidos = appointments.filter(a => a.status === 'concluido').length;

    return [
      { label: 'Hoje', value: `${todayCount} compromis.`, icon: CalendarIcon, color: 'text-primary' },
      { label: 'A Receber', value: `R$ ${aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-500' },
      { label: 'Reuniões', value: `${reunioes} pendentes`, icon: Users, color: 'text-blue-500' },
      { label: 'Concluídos', value: `${concluidos} este mês`, icon: CheckCircle, color: 'text-purple-500' },
    ];
  }, [appointments]);

  const upcomingPayments = useMemo(() => {
    return appointments
      .filter(a => a.type === 'pagamento' && a.status !== 'concluido')
      .slice(0, 3);
  }, [appointments]);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-primary flex items-center gap-3">
            <CalendarCheck className="text-primary" size={36} />
            Agenda & Compromissos
          </h1>
          <p className="text-sm text-gray-500 font-medium">Reuniões, pagamentos e tarefas administrativas</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner border border-black/5">
            {(['hoje', 'semana', 'mes'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                  period === p 
                    ? 'bg-white shadow-xl text-primary scale-100' 
                    : 'text-gray-400 opacity-60 hover:opacity-100 scale-95 hover:scale-100'
                }`}
              >
                {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semanal' : 'Mensal'}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 bg-primary text-white rounded-2xl text-xs font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 group ml-2"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Novo Compromisso
          </button>
        </div>
      </header>

      {/* KPI Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-[2rem] border border-primary/5 shadow-sm bg-white"
          >
            <div className={`p-3 rounded-2xl bg-gray-50 w-fit mb-4 ${kpi.color}`}>
              <kpi.icon size={20} />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-2xl font-display font-black text-gray-900">{kpi.value}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display font-black text-xl text-gray-900">
              {period === 'hoje' ? 'Compromissos de Hoje' : period === 'semana' ? 'Próximos 7 dias' : 'Todos os Compromissos'}
            </h3>
            <span className="text-xs font-bold text-gray-400">{filteredList.length} itens</span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredList.length > 0 ? (
                filteredList.map((app) => (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`glass-card p-5 rounded-[2rem] bg-white border border-primary/5 shadow-sm group transition-all ${app.status === 'concluido' ? 'opacity-60 grayscale' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-1 rounded-full ${TYPE_CONFIG[app.type]?.bg || 'bg-gray-100'} ${TYPE_CONFIG[app.type]?.color?.replace('text-', 'bg-') || 'bg-gray-400'}`}></div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${TYPE_CONFIG[app.type]?.bg} ${TYPE_CONFIG[app.type]?.color}`}>
                              {TYPE_CONFIG[app.type]?.label}
                            </span>
                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{app.title}</h4>
                          </div>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full ${STATUS_CONFIG[app.status]?.color}`}>
                            {STATUS_CONFIG[app.status]?.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 mt-3">
                          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <CalendarIcon size={14} className="text-primary" />
                              {new Date(app.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                            </span>
                            {app.time_start && (
                               <span className="flex items-center gap-1.5">
                                 <Clock size={14} className="text-primary" />
                                 {app.time_start} {app.time_end ? `- ${app.time_end}` : ''}
                               </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                            {app.responsible && (
                               <span className="flex items-center gap-1.5">
                                 <User size={14} className="text-primary" />
                                 {app.responsible}
                               </span>
                            )}
                            {app.type === 'pagamento' && app.amount && (
                               <span className="font-bold text-emerald-600">
                                 R$ {app.amount.toLocaleString('pt-BR')}
                               </span>
                            )}
                          </div>
                        </div>

                        {app.description && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-2xl text-[11px] text-gray-500 leading-relaxed font-medium">
                            {app.description}
                          </div>
                        )}

                        <div className="mt-5 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setSelectedAppointment(app);
                              setIsModalOpen(true);
                            }}
                            className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black hover:bg-gray-100 transition-all border border-gray-100"
                          >
                            Editar
                          </button>
                          {app.status !== 'concluido' && (
                            <button 
                              onClick={() => handleComplete(app.id)}
                              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={12} />
                              Concluir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                  <div className="p-4 bg-gray-50 w-fit mx-auto rounded-3xl text-gray-400 mb-4">
                    <CalendarCheck size={40} />
                  </div>
                  <h5 className="font-bold text-gray-900">Tudo em dia!</h5>
                  <p className="text-xs text-gray-500 max-w-[200px] mx-auto mt-1">Não existem compromissos pendentes para este período.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Calendar + Vencimentos */}
        <div className="lg:col-span-2 space-y-8">
          {/* Mini Calendar */}
          <div className="glass-card p-6 rounded-[2.5rem] bg-white border border-primary/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-display font-black text-gray-900 text-lg uppercase">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
                <span key={`${d}-${idx}`} className="text-[10px] font-black text-gray-400">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((date, i) => {
                const isToday = date?.toDateString() === new Date().toDateString();
                const hasApps = date && appointments.some(a => new Date(a.date).toDateString() === date.toDateString());
                
                return (
                  <div key={i} className="aspect-square flex flex-col items-center justify-center relative">
                    <span className={`text-xs font-bold w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                      !date ? 'opacity-0' :
                      isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 
                      'text-gray-700 hover:bg-gray-100'
                    }`}>
                      {date?.getDate()}
                    </span>
                    {hasApps && date && !isToday && (
                      <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="glass-card p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <DollarSign size={80} className="text-primary" />
            </div>
            
            <h4 className="font-display font-black text-emerald-700 flex items-center gap-2 mb-6">
              <DollarSign size={20} />
              Próximos Vencimentos
            </h4>

            <div className="space-y-4">
              {upcomingPayments.length > 0 ? (
                upcomingPayments.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-white/60 p-4 rounded-2xl border border-white">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{p.title}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        {new Date(p.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <p className="text-sm font-black text-emerald-600">
                      R$ {p.amount?.toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-emerald-600/70 font-medium italic">Nenhum pagamento próximo para exibir.</p>
              )}
            </div>

            <button className="w-full mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:gap-4 transition-all">
              Ver Financeiro Completo <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <AppointmentModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(null);
        }}
        onSuccess={fetchAppointments}
        appointment={selectedAppointment}
      />
    </div>
  );
}
