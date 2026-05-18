import { Zap } from 'lucide-react';

export interface DashboardData {
  revenue: { day: string; cur: number; prev: number }[];
  occupancy: { name: string; value: number }[];
  enrollment: { month: string; enrolled: number }[];
  kpis: {
    alunos: { value: string; change: string; trend: 'up' | 'down' };
    ocupacao: { value: string; change: string; trend: 'up' | 'down' };
    receita: { value: string; change: string; trend: 'up' | 'down' };
    alertas: { value: string; change: string; trend: 'up' | 'down' };
  };
  operation: {
    aulas: number;
    vagas: number;
    receitaDia: string;
    presenca: string;
  };
  upcoming: any[];
  alerts: any[];
  insights: any[];
}

export const DASHBOARD_DATA: Record<'Hoje' | 'Esta Semana' | 'Este Mês', DashboardData> = {
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
      { name: 'Sex', value: 88 },
      { name: 'Sab', value: 45 },
    ],
    enrollment: [
      { month: 'Seg', enrolled: 12 },
      { month: 'Ter', enrolled: 8 },
      { month: 'Qua', enrolled: 15 },
      { month: 'Qui', enrolled: 22 },
      { month: 'Sex', enrolled: 18 },
    ],
    kpis: {
      alunos: { value: "342", change: "+5.4%", trend: 'up' },
      ocupacao: { value: "81.2%", change: "+4.1%", trend: 'up' },
      receita: { value: "R$ 28.5k", change: "+8%", trend: 'up' },
      alertas: { value: "5", change: "-2", trend: 'down' }
    },
    operation: {
      aulas: 284,
      vagas: 42,
      receitaDia: "R$ 28.5k",
      presenca: "91%"
    },
    upcoming: [
      { id: '3', subject: 'Simulado Geral', teacher: 'Coordenação', time: 'Qui 08:00', status: 'pendente', room: 'Auditório', urgency: 'AGENDADO', startIn: '2 dias' },
    ],
    alerts: [
      { id: 'a2', type: 'financeiro', title: 'Mensalidades Atrasadas', desc: '14 alunos com mais de 5 dias de atraso nas parcelas de Abril.', priority: 'medium' },
    ],
    insights: [
      { id: 'i2', icon: Zap, text: 'A taxa de comparecimento aumentou 4% em relação à semana passada.', highlight: 'Engajamento alto' },
    ]
  },
  'Este Mês': {
    revenue: [
      { day: 'Semana 1', cur: 28500, prev: 26000 },
      { day: 'Semana 2', cur: 31200, prev: 29500 },
      { day: 'Semana 3', cur: 29800, prev: 31000 },
      { day: 'Semana 4', cur: 34500, prev: 30000 },
    ],
    occupancy: [
      { name: 'Semana 1', value: 78 },
      { name: 'Semana 2', value: 84 },
      { name: 'Semana 3', value: 81 },
      { name: 'Semana 4', value: 89 },
    ],
    enrollment: [
      { month: 'Semana 1', enrolled: 45 },
      { month: 'Semana 2', enrolled: 52 },
      { month: 'Semana 3', enrolled: 38 },
      { month: 'Semana 4', enrolled: 61 },
    ],
    kpis: {
      alunos: { value: "1,248", change: "+12.4%", trend: 'up' },
      ocupacao: { value: "83.2%", change: "+2.1%", trend: 'up' },
      receita: { value: "R$ 124.0k", change: "+15%", trend: 'up' },
      alertas: { value: "12", change: "-4", trend: 'down' }
    },
    operation: {
      aulas: 1142,
      vagas: 184,
      receitaDia: "R$ 124.0k",
      presenca: "92%"
    },
    upcoming: [
      { id: '4', subject: 'Encerramento Mensal', teacher: 'Diretoria', time: '30/05 18:00', status: 'pendente', room: 'Reunião', urgency: 'AGENDADO', startIn: '15 dias' },
    ],
    alerts: [
      { id: 'a3', type: 'administrativo', title: 'Renovação de Contratos', desc: '45 contratos expiram no próximo mês.', priority: 'medium' },
    ],
    insights: [
      { id: 'i3', icon: Zap, text: 'O faturamento deste mês superou a meta em 12%.', highlight: 'Meta batida' },
    ]
  }
};
