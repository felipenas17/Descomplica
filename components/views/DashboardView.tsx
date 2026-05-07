'use client';

import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  CheckCircle2,
  MoreVertical,
  Plus,
  Target,
  BarChart3,
  Search
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// Enhanced Mock Data for Strategic Dashboard
const DATA_SET = {
  'Hoje': {
    revenue: [
      { day: '08:00', cur: 400, prev: 350 },
      { day: '10:00', cur: 1200, prev: 900 },
      { day: '12:00', cur: 800, prev: 1100 },
      { day: '14:00', cur: 2500, prev: 2000 },
      { day: '16:00', cur: 3200, prev: 2800 },
      { day: '18:00', cur: 4500, prev: 4000 },
      { day: '20:00', cur: 5200, prev: 4800 },
    ],
    occupancy: [
      { name: 'Manhã', value: 45 },
      { name: 'Tarde', value: 92 },
      { name: 'Noite', value: 78 },
    ],
    enrollment: [
      { month: '08', enrolled: 5 },
      { month: '10', enrolled: 12 },
      { month: '12', enrolled: 8 },
      { month: '14', enrolled: 15 },
    ],
    kpis: {
      alunos: { value: "124", change: "+2%", trend: 'up' },
      ocupacao: { value: "78.5%", change: "-1.2%", trend: 'down' },
      receita: { value: "R$ 5.2k", change: "+14%", trend: 'up' },
      alertas: { value: "2", change: "0", trend: 'up' }
    },
    operation: {
      aulas: 42,
      vagas: 15,
      receitaDia: "R$ 5.2k",
      presenca: "94%"
    },
    upcoming: [
      { id: '1', subject: 'Matemática (ENEM)', teacher: 'Ricardo Almeida', time: '14:30', status: 'em_aula', room: 'Sala A01', urgency: 'EM AULA', timeLeft: '15 min' },
      { id: '2', subject: 'Física Avançada', teacher: 'Sandra Mendes', time: '15:45', status: 'proximo', room: 'Sala B02', urgency: 'PRÓXIMO', startIn: '45 min' },
    ],
    alerts: [
      { id: 'a1', type: 'operacional', title: 'Conflito de Agenda', desc: 'Prof. Ricardo tem duas aulas marcadas às 15:00 na Sala A02.', priority: 'high' },
    ],
    insights: [
      { id: 'i1', icon: Zap, text: 'Quinta-feira é o dia mais lucrativo da semana.', highlight: 'Foco em vendas' },
    ]
  },
  'Esta Semana': {
    revenue: [
      { day: 'Seg', cur: 4500, prev: 4100 },
      { day: 'Ter', cur: 5200, prev: 4800 },
      { day: 'Qua', cur: 4800, prev: 5000 },
      { day: 'Qui', cur: 6100, prev: 5200 },
      { day: 'Sex', cur: 5500, prev: 5300 },
      { day: 'Sab', cur: 2200, prev: 2500 },
      { day: 'Dom', cur: 0, prev: 0 },
    ],
    occupancy: [
      { name: 'Seg', value: 85 },
      { name: 'Ter', value: 92 },
      { name: 'Qua', value: 78 },
      { name: 'Qui', value: 95 },
      { name: 'Sex', value: 82 },
      { name: 'Sab', value: 45 },
    ],
    enrollment: [
      { month: 'Seg', enrolled: 12 },
      { month: 'Ter', enrolled: 15 },
      { month: 'Qua', enrolled: 10 },
      { month: 'Qui', enrolled: 18 },
      { month: 'Sex', enrolled: 14 },
    ],
    kpis: {
      alunos: { value: "412", change: "+8.4%", trend: 'up' },
      ocupacao: { value: "81.2%", change: "+2.1%", trend: 'up' },
      receita: { value: "R$ 28.4k", change: "+12.5%", trend: 'up' },
      alertas: { value: "5", change: "-1", trend: 'down' }
    },
    operation: {
      aulas: 284,
      vagas: 92,
      receitaDia: "R$ 28.4k",
      presenca: "91%"
    },
    upcoming: [
      { id: '1', subject: 'Matemática (ENEM)', teacher: 'Ricardo Almeida', time: '14:30', status: 'em_aula', room: 'Sala A01', urgency: 'EM AULA', timeLeft: '15 min' },
      { id: '2', subject: 'Física Avançada', teacher: 'Sandra Mendes', time: '15:45', status: 'proximo', room: 'Sala B02', urgency: 'PRÓXIMO', startIn: '45 min' },
      { id: '3', subject: 'Química Geral', teacher: 'Carlos Eduardo', time: '16:00', status: 'proximo', room: 'Sala A03', urgency: 'PRÓXIMO', startIn: '1h' },
    ],
    alerts: [
      { id: 'a1', type: 'financeiro', title: 'Pagamentos Pendentes', desc: '5 alunos com mensalidades em aberto esta semana.', priority: 'mid' },
      { id: 'a2', type: 'operacional', title: 'Conflito de Agenda', desc: 'Prof. Ricardo tem duas aulas marcadas às 15:00 na Sala A02.', priority: 'high' },
    ],
    insights: [
      { id: 'i1', icon: Zap, text: 'Quinta-feira é o dia mais lucrativo da semana.', highlight: 'Foco em vendas' },
      { id: 'i2', icon: Users, text: 'Professora Sandra está com 98% de ocupação.', highlight: 'Contratação recomendada' },
    ]
  },
  'Este Mês': {
    revenue: [
      { day: '01', cur: 4000, prev: 3800 },
      { day: '05', cur: 12000, prev: 10000 },
      { day: '10', cur: 18000, prev: 15000 },
      { day: '15', cur: 25000, prev: 24000 },
      { day: '20', cur: 32000, prev: 30000 },
      { day: '25', cur: 45000, prev: 41000 },
      { day: '30', cur: 52000, prev: 48000 },
    ],
    occupancy: [
      { name: 'Sem 1', value: 82 },
      { name: 'Sem 2', value: 88 },
      { name: 'Sem 3', value: 94 },
      { name: 'Sem 4', value: 81 },
    ],
    enrollment: [
      { month: 'Jan', enrolled: 45 },
      { month: 'Fev', enrolled: 52 },
      { month: 'Mar', enrolled: 48 },
      { month: 'Abr', enrolled: 61 },
      { month: 'Mai', enrolled: 55 },
      { month: 'Jun', enrolled: 67 },
    ],
    kpis: {
      alunos: { value: "1.284", change: "+12.5%", trend: 'up' },
      ocupacao: { value: "84.2%", change: "+4.2%", trend: 'up' },
      receita: { value: "R$ 142.5k", change: "+8.1%", trend: 'up' },
      alertas: { value: "14", change: "-2", trend: 'down' }
    },
    operation: {
      aulas: 1240,
      vagas: 420,
      receitaDia: "R$ 142.5k",
      presenca: "89%"
    },
    upcoming: [
      { id: '1', subject: 'Matemática (ENEM)', teacher: 'Ricardo Almeida', time: '14:30', status: 'em_aula', room: 'Sala A01', urgency: 'EM AULA', timeLeft: '15 min' },
      { id: '2', subject: 'Física Avançada', teacher: 'Sandra Mendes', time: '15:45', status: 'proximo', room: 'Sala B02', urgency: 'PRÓXIMO', startIn: '45 min' },
      { id: '3', subject: 'Química Geral', teacher: 'Carlos Eduardo', time: '16:00', status: 'proximo', room: 'Sala A03', urgency: 'PRÓXIMO', startIn: '1h' },
      { id: '4', subject: 'História do Brasil', teacher: 'Ana Beatriz', time: '09:00', status: 'realizada', room: 'Lab 01', urgency: 'CONCLUÍDA' },
    ],
    alerts: [
      { id: 'a1', type: 'financeiro', title: 'Atraso de Mensalidade', desc: '14 alunos com pagamentos vencidos há mais de 5 dias.', priority: 'high' },
      { id: 'a2', type: 'operacional', title: 'Conflito de Agenda', desc: 'Prof. Ricardo tem duas aulas marcadas às 15:00 na Sala A02.', priority: 'mid' },
      { id: 'a3', type: 'vendas', title: 'Queda de Matrículas', desc: 'Procura por aulas de Humanas caiu 15% este mês.', priority: 'low' },
    ],
    insights: [
      { id: 'i1', icon: Zap, text: 'Quinta-feira é o dia mais lucrativo da semana.', highlight: 'Foco em vendas' },
      { id: 'i2', icon: Users, text: 'Professora Sandra está com 98% de ocupação.', highlight: 'Contratação recomendada' },
      { id: 'i3', icon: Wallet, text: '3 alunos representam 25% da sua receita recorrente.', highlight: 'Risco de Churn' },
    ]
  }
} as const;

const KPICard = ({ title, value, change, icon: Icon, trend }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between"
  >
    <div className="flex justify-between items-start">
      <div className="p-3 bg-gray-50 rounded-2xl text-purple-600">
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 font-bold text-xs ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </div>
    </div>
    <div className="mt-8">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{title}</p>
      <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
    </div>
  </motion.div>
);

export default function DashboardView() {
  const [filterPeriod, setFilterPeriod] = useState<'Hoje' | 'Esta Semana' | 'Este Mês'>('Este Mês');
  const currentData = DATA_SET[filterPeriod];

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Global Filters */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Painel Estratégico</h1>
          <p className="text-gray-500 font-bold mt-1">Bem-vindo de volta! Aqui está o pulso do seu negócio hoje.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {['Hoje', 'Esta Semana', 'Este Mês'].map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                filterPeriod === period 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' 
                : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total de Alunos" value={currentData.kpis.alunos.value} change={currentData.kpis.alunos.change} icon={Users} trend={currentData.kpis.alunos.trend} />
        <KPICard title="Ocupação Média" value={currentData.kpis.ocupacao.value} change={currentData.kpis.ocupacao.change} icon={GraduationCap} trend={currentData.kpis.ocupacao.trend} />
        <KPICard title="Receita Bruta" value={currentData.kpis.receita.value} change={currentData.kpis.receita.change} icon={Wallet} trend={currentData.kpis.receita.trend} />
        <KPICard title="Alertas Ativos" value={currentData.kpis.alertas.value} change={currentData.kpis.alertas.change} icon={AlertCircle} trend={currentData.kpis.alertas.trend} />
      </div>

      {/* Operation & Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Operation */}
        <div className="lg:col-span-2 bg-gradient-to-br from-purple-700 to-purple-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-[0.03] rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-8 flex items-center gap-2">
              <Zap size={20} className="text-purple-300" />
              Operação ({filterPeriod})
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-purple-200 text-[10px] font-black uppercase tracking-widest mb-1">Aulas do Período</p>
                <p className="text-4xl font-black">{currentData.operation.aulas}</p>
                <p className="text-purple-300 text-[10px] font-bold mt-2">Dados processados</p>
              </div>
              <div>
                <p className="text-purple-200 text-[10px] font-black uppercase tracking-widest mb-1">Vagas Livres</p>
                <p className="text-4xl font-black">{currentData.operation.vagas}</p>
                <p className="text-purple-300 text-[10px] font-bold mt-2">Otimização possível</p>
              </div>
              <div>
                <p className="text-purple-200 text-[10px] font-black uppercase tracking-widest mb-1">Receita</p>
                <p className="text-4xl font-black">{currentData.operation.receitaDia}</p>
                <p className="text-purple-300 text-[10px] font-bold mt-2">Valor acumulado</p>
              </div>
              <div>
                <p className="text-purple-200 text-[10px] font-black uppercase tracking-widest mb-1">Presença</p>
                <p className="text-4xl font-black">{currentData.operation.presenca}</p>
                <p className="text-purple-300 text-[10px] font-bold mt-2">Taxa de check-in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance vs Goal */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-900">Meta de Receita</h3>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Target size={20} />
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-4xl font-black text-gray-900">R$ 142k</p>
                  <p className="text-sm font-bold text-gray-400">de R$ 160k</p>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-purple-600 rounded-full"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Progresso</p>
                <p className="text-lg font-black text-purple-600">85%</p>
              </div>
            </div>
          </div>

          <button className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black hover:bg-black transition-all mt-6">
            Ajustar Metas
          </button>
        </div>
      </div>

      {/* Main Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Flow Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-gray-900">Fluxo de Receita</h3>
              <p className="text-xs font-bold text-gray-400 mt-1">Comparativo acumulado vs mês anterior</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span className="text-[10px] font-black text-gray-400 uppercase">Atual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-200" />
                <span className="text-[10px] font-black text-gray-400 uppercase">Anterior</span>
              </div>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData.revenue as any}>
                <defs>
                  <linearGradient id="colorCur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 800 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '15px' }}
                  labelStyle={{ fontWeight: 900, marginBottom: '5px' }}
                />
                <Area type="monotone" dataKey="cur" stroke="#9333ea" strokeWidth={4} fillOpacity={1} fill="url(#colorCur)" />
                <Area type="monotone" dataKey="prev" stroke="#e5e7eb" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Heatmap (Simplified Chart) */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-8">Ocupação ({filterPeriod})</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData.occupancy as any} layout="vertical" margin={{ left: -30 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 800 }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '15px', border: 'none' }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {currentData.occupancy.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 90 ? '#9333ea' : '#9333ea44'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-purple-50 rounded-2xl">
            <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Status da Agenda</p>
            <p className="text-xs font-bold text-purple-800 leading-relaxed">Alta demanda às Quintas. Recomendado abrir novas turmas.</p>
          </div>
        </div>
      </div>

      {/* Active Agenda & Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Classes List - Improved */}
        <section className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-gray-900">Status dos Professores</h3>
              <p className="text-xs font-bold text-gray-400 mt-1">Acompanhamento em tempo real das salas</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Ao Vivo
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {currentData.upcoming.map((cls: any) => (
              <motion.div 
                key={cls.id}
                whileHover={{ x: 4, scale: 1.01 }}
                className="flex flex-col md:flex-row items-center justify-between p-6 rounded-3xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200 group gap-4 md:gap-0"
              >
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 ${
                    cls.status === 'em_aula' ? 'bg-purple-600 text-white shadow-xl shadow-purple-200' : 
                    cls.status === 'proximo' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <span className="text-[9px] font-black leading-none mb-1">{cls.urgency}</span>
                    <span className="text-xs font-black">{cls.timeLeft || cls.startIn || '-'}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 group-hover:text-purple-600 transition-colors uppercase text-sm tracking-tight">{cls.teacher}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                       <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                         <Search size={14} className="text-purple-400" /> {cls.subject}
                       </div>
                       <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                         <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center text-[8px] font-black text-gray-500">R</div> {cls.room}
                       </div>
                       <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                         <Clock size={14} className="text-purple-400" /> {cls.time}
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    cls.status === 'em_aula' ? 'bg-purple-100 text-purple-700' : 
                    cls.status === 'proximo' ? 'bg-emerald-100 text-emerald-700' : 
                    cls.status === 'realizada' ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {cls.status === 'em_aula' ? 'Em Aula' : cls.status === 'proximo' ? 'Próximo' : 'Concluído'}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {cls.status === 'em_aula' ? (
                      <button className="px-6 py-2.5 bg-purple-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-100">
                        Monitorar
                      </button>
                    ) : cls.status === 'proximo' ? (
                      <button className="px-6 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
                        Preparar
                      </button>
                    ) : null}
                    <button className="p-2.5 hover:bg-white rounded-xl text-gray-400 group-hover:text-gray-900 transition-all border border-transparent group-hover:border-gray-100">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Growth Metrics */}
        <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-900">Crescimento</h3>
            <TrendingUp size={20} className="text-purple-400" />
          </div>
          <div className="space-y-6 flex-1">
            <div className="p-6 bg-purple-50 rounded-[2rem] border border-purple-100">
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">MRR (Recorrente)</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black text-purple-900">R$ 128k</p>
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs mb-1">
                  <ArrowUpRight size={14} />
                  +15%
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Churn Rate</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black text-rose-900">2.4%</p>
                <div className="flex items-center gap-1 text-rose-600 font-bold text-xs mb-1">
                  <ArrowUpRight size={14} />
                  +0.2%
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Tendência de Matrículas</p>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentData.enrollment as any}>
                    <Bar dataKey="enrolled" fill="#9333ea" radius={[4, 4, 0, 0]} />
                    <XAxis dataKey="month" hide />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Alerts & Insights Combined */}
        <div className="space-y-8">
          {/* Critical Alerts */}
          <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <AlertCircle size={24} className="text-rose-500" />
              Alertas Críticos
            </h3>
            
            <div className="space-y-4">
              {currentData.alerts.map((alerta) => (
                <div 
                  key={alerta.id}
                  className={`p-5 rounded-3xl border-l-8 flex items-start justify-between gap-4 ${
                    alerta.priority === 'high' ? 'bg-rose-50 border-rose-500' : 
                    alerta.priority === 'mid' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div>
                    <h5 className={`font-black text-sm uppercase tracking-tight ${
                      alerta.priority === 'high' ? 'text-rose-600' : 
                      alerta.priority === 'mid' ? 'text-amber-600' : 'text-blue-600'
                    }`}>{alerta.title}</h5>
                    <p className="text-xs font-bold text-gray-600 mt-1 leading-relaxed">{alerta.desc}</p>
                  </div>
                  <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shrink-0 ${
                    alerta.priority === 'high' ? 'bg-rose-600 text-white' : 
                    alerta.priority === 'mid' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    Resolver
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Business Insights */}
          <section className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <TrendingUp size={24} className="text-purple-400" />
              Insights do Negócio
            </h3>
            
            <div className="space-y-6">
              {currentData.insights.map((insight) => (
                <div key={insight.id} className="flex gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl text-purple-400 shrink-0">
                    <insight.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">{insight.highlight}</p>
                    <p className="text-sm font-bold text-white/90 leading-relaxed">{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

      {/* Floating Action Menu (Abstracted or Handled in Page) */}
    </div>
  );
}
