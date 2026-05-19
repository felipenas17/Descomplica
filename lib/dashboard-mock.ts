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
  operation: { aulas: number; vagas: number; receitaDia: string; presenca: string; };
  upcoming: any[];
  alerts: any[];
  insights: any[];
}

const empty = { revenue: [], occupancy: [], enrollment: [], kpis: { alunos: { value: "0", change: "0%", trend: 'up' as const }, ocupacao: { value: "0%", change: "0%", trend: 'up' as const }, receita: { value: "R$ 0,00", change: "0%", trend: 'up' as const }, alertas: { value: "0", change: "0", trend: 'up' as const } }, operation: { aulas: 0, vagas: 0, receitaDia: "R$ 0,00", presenca: "0%" }, upcoming: [], alerts: [], insights: [] };

export const DASHBOARD_DATA: Record<'Hoje' | 'Esta Semana' | 'Este Mês', DashboardData> = {
  'Hoje': empty,
  'Esta Semana': empty,
  'Este Mês': empty
};
