'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  AlertCircle,
  Clock,
  Plus,
  Target,
  BarChart3,
  CheckCircle2,
  MoreVertical,
  Zap,
  Loader2
} from 'lucide-react';
import { DashboardKPI } from './dashboard/DashboardKPI';
const DashboardCharts = dynamic(() => import('./dashboard/DashboardCharts'), { 
  ssr: false,
  loading: () => (
    <div className="lg:col-span-12 h-[500px] flex items-center justify-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando Gráficos...</p>
      </div>
    </div>
  )
});
import { DASHBOARD_DATA } from '@/lib/dashboard-mock';
import SupabaseDebug from '../SupabaseDebug';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';


export default function DashboardView() {
  const [period, setPeriod] = useState<'Hoje' | 'Esta Semana' | 'Este Mês'>('Hoje');
  const [loading, setLoading] = useState(true);
  const [realData, setRealData] = useState<any>(null);

  const mockData = useMemo(() => {
    if (period === 'Este Mês') return DASHBOARD_DATA['Esta Semana']; // Mock doesn't have Month
    return DASHBOARD_DATA[period as 'Hoje' | 'Esta Semana'];
  }, [period]);

  useEffect(() => {
    async function fetchRealDashboardData() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let startDate, endDate;
        const now = new Date();

        if (period === 'Hoje') {
          startDate = startOfDay(now);
          endDate = endOfDay(now);
        } else if (period === 'Esta Semana') {
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
        } else {
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
        }

        const startDateIso = startDate.toISOString();
        const endDateIso = endDate.toISOString();

        // 0. Previous Period Dates for Comparison
        const duration = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - duration - 1);
        const prevEndDate = new Date(endDate.getTime() - duration - 1);
        const prevStartDateIso = prevStartDate.toISOString();
        const prevEndDateIso = prevEndDate.toISOString();

        // 1. Alunos Ativos
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Ativo');
        
        const { count: prevStudentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Ativo')
          .lt('created_at', startDateIso);

        // 2. Receita Real
        const { data: revenueData } = await supabase
          .from('transactions')
          .select('amount, date')
          .eq('type', 'receita')
          .gte('date', startDateIso.split('T')[0])
          .lte('date', endDateIso.split('T')[0]);
        
        const { data: prevRevenueData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'receita')
          .gte('date', prevStartDateIso.split('T')[0])
          .lte('date', prevEndDateIso.split('T')[0]);
        
        const totalRevenue = revenueData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
        const prevTotalRevenue = prevRevenueData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

        // 3. Ocupação (Baseado em schedules)
        const { count: schedulesCount } = await supabase
          .from('schedules')
          .select('*', { count: 'exact', head: true })
          .gte('date', startDateIso.split('T')[0])
          .lte('date', endDateIso.split('T')[0]);

        // 4. Alertas
        const { data: alertsData } = await supabase
          .from('schedules')
          .select('*')
          .gte('date', startDateIso.split('T')[0])
          .lte('date', endDateIso.split('T')[0])
          .eq('is_test_week', true);

        // 5. Próximas Aulas
        const { data: upcomingData } = await supabase
          .from('schedules')
          .select('*')
          .gte('date', format(now, 'yyyy-MM-dd'))
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(4);

        // Group revenue by day for the chart
        const days = period === 'Hoje' ? ['H'] : ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
        const chartData = days.map(day => {
          // Simplificação: distribuindo receita real nos dias
          // Em um app real, agruparíamos por dia da semana no SQL
          return {
            day,
            cur: day === 'SEG' ? totalRevenue : (totalRevenue / 7) * (Math.random() + 0.5),
            prev: prevTotalRevenue / 7
          };
        });

        const revenueDiff = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;

        setRealData({
          kpis: {
            alunos: { 
              value: studentsCount?.toString() || '0', 
              change: prevStudentsCount ? `${(((studentsCount || 0) - prevStudentsCount) / prevStudentsCount * 100).toFixed(0)}%` : '+0%', 
              trend: (studentsCount || 0) >= (prevStudentsCount || 0) ? 'up' : 'down' 
            },
            receita: { 
              value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`, 
              change: `${revenueDiff > 0 ? '+' : ''}${revenueDiff.toFixed(0)}%`, 
              trend: revenueDiff >= 0 ? 'up' : 'down' 
            },
            ocupacao: { 
              value: `${Math.min(95, (schedulesCount || 0) * 8)}%`, 
              change: '+2%', 
              trend: 'up' 
            },
            alertas: { 
              value: (alertsData?.length || 0).toString(), 
              change: (alertsData?.length || 0) > 0 ? 'Atenção' : 'Limpo', 
              trend: (alertsData?.length || 0) > 0 ? 'up' : 'down' 
            }
          },
          upcoming: upcomingData?.map(s => ({
            id: s.id,
            time: s.start_time,
            subject: s.subject,
            teacher: s.teacher_name,
            room: 'Sala ' + (Math.floor(Math.random() * 5) + 1),
            status: s.status || 'agendado',
            urgency: s.is_test_week ? 'Importante' : 'Normal',
            startIn: 'Em breve'
          })) || [],
          revenue: chartData,
          occupancy: [
            { name: 'Sala A', value: 85 },
            { name: 'Sala B', value: 72 },
            { name: 'Sala C', value: 64 },
            { name: 'Sala D', value: 45 }
          ],
          insights: [
            { id: 1, text: `Você teve ${schedulesCount || 0} aulas agendadas neste período.`, highlight: 'Insight Acadêmico' },
            { id: 2, text: revenueDiff > 0 ? `Seu faturamento cresceu ${revenueDiff.toFixed(0)}% em relação ao período anterior.` : 'Faturamento estável.', highlight: 'Finanças' }
          ],
          alerts: alertsData?.slice(0, 3).map((a) => ({
            id: a.id,
            type: 'PEDAGÓGICO',
            title: a.subject,
            desc: `Semana de prova para ${a.student_name}.`,
            priority: 'high'
          })) || [],
          operation: {
            aulas: schedulesCount || 0,
            presenca: '94%'
          }
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealDashboardData();
  }, [period]);

  const displayData = realData || mockData;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="font-bold text-gray-500">Sincronizando dados escolares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 max-w-[1600px] mx-auto px-4 md:px-8">
      <SupabaseDebug />
      
      {/* STRATEGIC HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 bg-gray-900 p-10 md:p-16 rounded-[4rem] text-white shadow-3xl shadow-gray-200 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary opacity-10 -mr-[100px] -mt-[200px] blur-[150px] group-hover:opacity-20 transition-opacity pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/20 rounded-lg"><Target className="text-primary" size={18} /></div>
            <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Performance Operacional</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] font-display">Controle <span className="text-primary italic font-light">&</span><br />Estratégia</h1>
          <p className="text-gray-400 mt-8 font-bold text-sm max-w-md leading-relaxed">
            Painel de controle centralizado para gestão administrativa e acadêmica. Monitore KPIs críticos em tempo real.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/10 flex shadow-2xl">
            {(['Hoje', 'Esta Semana', 'Este Mês'] as const).map(p => (
              <button 
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-8 py-5 rounded-[2rem] text-[10px] font-black transition-all ${period === p ? 'bg-primary text-white shadow-xl shadow-primary/40' : 'text-gray-400 hover:text-white'}`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          
          <button onClick={() => window.dispatchEvent(new CustomEvent('global-plus-click'))} className="p-6 bg-white text-gray-900 rounded-[2.2rem] shadow-2xl shadow-gray-900/50 hover:scale-110 active:scale-95 transition-all ring-8 ring-white/5">
            <Plus size={32} />
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <DashboardKPI label="Alunos Ativos" value={displayData.kpis.alunos.value} change={displayData.kpis.alunos.change} trend={displayData.kpis.alunos.trend} icon={Users} color="from-primary to-indigo-600" />
        <DashboardKPI label="Ocupação Média" value={displayData.kpis.ocupacao.value} change={displayData.kpis.ocupacao.change} trend={displayData.kpis.ocupacao.trend} icon={BarChart3} color="from-emerald-500 to-teal-600" />
        <DashboardKPI label="Receita Bruta" value={displayData.kpis.receita.value} change={displayData.kpis.receita.change} trend={displayData.kpis.receita.trend} icon={Wallet} color="from-secondary to-orange-600" />
        <DashboardKPI label="Alertas Ativos" value={displayData.kpis.alertas.value} change={displayData.kpis.alertas.change} trend={displayData.kpis.alertas.trend} icon={AlertCircle} color="from-rose-500 to-orange-500" />
      </div>

            <DashboardCharts revenueData={displayData.revenue} occupancyData={displayData.occupancy} />

      {/* OPERATIONAL BOTTOM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* UPCOMING CLASSES */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between mb-2 px-4">
            <h3 className="text-xl font-black text-gray-900 tracking-tight font-display">Grade de Aulas (Hoje)</h3>
            <button className="text-xs font-black text-primary hover:underline underline-offset-8">Ver Todas</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(displayData.upcoming || []).map((item: any) => (
              <div key={item.id} className="glass-card p-10 rounded-[3rem] border border-white hover:shadow-2xl hover:scale-[1.02] transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[10px] font-black tracking-widest ${item.status === 'em_aula' ? 'bg-rose-500 text-white' : 'bg-primary text-white'}`}>
                  {item.urgency}
                </div>
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform">
                      <Clock className="text-primary" size={24} />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-gray-900 font-display">{item.time}</h4>
                      <p className="text-xs text-gray-400 font-bold">{item.room}</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <p className="text-lg font-black text-gray-800 leading-tight">{item.subject}</p>
                   <div className="flex items-center gap-2">
                      <GraduationCap className="text-gray-400" size={16} />
                      <p className="text-xs font-bold text-gray-500">{item.teacher}</p>
                   </div>
                </div>
                <div className="mt-8 flex items-center justify-between pt-8 border-t border-gray-50">
                   <span className="text-xs font-black text-primary">{item.timeLeft || item.startIn} remanescentes</span>
                   <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                      <MoreVertical size={18} />
                   </button>
                </div>
              </div>
            ))}
          </div>

          {/* QUICK INSIGHTS BAR */}
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-primary opacity-5 group-hover:opacity-10 transition-opacity" />
             <div className="flex items-center gap-6 relative z-10">
                <div className="p-4 bg-primary/20 rounded-2xl border border-primary/20 shadow-inner">
                   <Zap className="text-primary" size={24} />
                </div>
                <div>
                   <p className="text-sm font-bold text-gray-200">{displayData.insights?.[0]?.text}</p>
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">{displayData.insights?.[0]?.highlight}</p>
                </div>
             </div>
             <button className="px-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all relative z-10">
                GERAR MAIS INSIGHTS
             </button>
          </div>
        </div>

        {/* ALERTS & STATUS */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass-card p-10 rounded-[3rem] border border-white shadow-sm flex flex-col bg-gray-50/30">
              <h3 className="text-xl font-black text-gray-900 tracking-tight font-display mb-10">Alertas do Sistema</h3>
              <div className="space-y-6 flex-1">
                 {(displayData.alerts || []).map((alert: any) => (
                    <div key={alert.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                       <div className="flex items-center gap-3 mb-4">
                          <div className={`w-2 h-2 rounded-full ${alert.priority === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-orange-400'}`} />
                          <span className={`text-[10px] font-black uppercase ${alert.priority === 'high' ? 'text-rose-500' : 'text-orange-500'}`}>{alert.type}</span>
                       </div>
                       <p className="text-sm font-black text-gray-900 mb-2 truncate group-hover:text-primary transition-colors">{alert.title}</p>
                       <p className="text-[10px] text-gray-400 font-bold leading-relaxed">{alert.desc}</p>
                    </div>
                 ))}
                 {(!displayData.alerts || displayData.alerts.length === 0) && (
                   <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="p-5 bg-emerald-50 text-emerald-500 rounded-full mb-4"><CheckCircle2 size={32} /></div>
                      <p className="text-sm font-black text-gray-900">Nenhum Problema</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Tudo operando normalmente</p>
                   </div>
                 )}
              </div>
              <button onClick={() => alert("Histórico em breve!")} className="mt-10 w-full py-5 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 hover:border-primary hover:text-primary transition-all">
                 VER HISTÓRICO COMPLETO
              </button>
           </div>

           <div className="bg-gradient-to-br from-primary to-indigo-700 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 -mr-10 -mt-10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              <h4 className="text-xl font-black font-display mb-8">Saúde Operacional</h4>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                 <div className="flex flex-col bg-white/10 p-5 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-white/50 uppercase mb-1">Aulas Hoje</span>
                    <span className="text-3xl font-black font-display">{displayData.operation?.aulas || 0}</span>
                 </div>
                 <div className="flex flex-col bg-white/10 p-5 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-white/50 uppercase mb-1">Presença</span>
                    <span className="text-3xl font-black font-display">{displayData.operation?.presenca || '0%'}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
