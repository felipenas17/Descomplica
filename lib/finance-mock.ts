export const DEFAULT_LIST = [
  { id: '1', name: 'Lucas Ferreira - Mensalidade Abr/2024', amount: '2.450,00', daysLate: 12, status: 'Crítico' },
  { id: '2', name: 'Mariana Duarte - Material Didático', amount: '850,00', daysLate: 5, status: 'Atenção' },
  { id: '3', name: 'Roberto Júnio - Mensalidade Abr/2024', amount: '2.450,00', daysLate: 8, status: 'Crítico' },
  { id: '4', name: 'Clara Meireles - Taxa de Evento', amount: '120,00', daysLate: 2, status: 'Atenção' },
];

export const FORECAST_DATA = [
  { day: '15/Mai', label: 'Mensalidades Lote 2', amount: '42.500', type: 'Entrada' },
  { day: '20/Mai', label: 'Pagamento Professores', amount: '55.000', type: 'Saída' },
  { day: '25/Mai', label: 'Recebimento Material', amount: '12.800', type: 'Entrada' },
  { day: '05/Jun', label: 'Aluguel e Operacional', amount: '15.000', type: 'Saída' },
];

export interface FinanceKPI {
  value: string;
  trendValue: string;
  trend: 'up' | 'down';
  subtitle: string;
}

export interface FinanceData {
  kpis: {
    revenue: FinanceKPI;
    expenses: FinanceKPI;
    profit: FinanceKPI;
    default: FinanceKPI;
  };
  secondary: { label: string; val: string; sub: string }[];
  chart: { month: string; revenue: number; expenses: number }[];
  costs: { name: string; value: number; color: string }[];
  dre: Record<string, string>;
}

export const PERIOD_DATA: Record<'mensal' | 'trimestral', FinanceData> = {
  mensal: {
    kpis: {
      revenue: { value: "R$ 162.400,00", trendValue: "18.5%", trend: "up", subtitle: "Recorde histórico" },
      expenses: { value: "R$ 102.150,00", trendValue: "4.2%", trend: "up", subtitle: "Aumento em Marketing" },
      profit: { value: "R$ 60.250,00", trendValue: "12.1%", trend: "up", subtitle: "Margem: 37.1%" },
      default: { value: "R$ 8.420,00", trendValue: "2.1%", trend: "down", subtitle: "Taxa: 5.2%" }
    },
    secondary: [
      { label: 'Ticket Médio', val: 'R$ 485,00', sub: 'Por aluno/mês' },
      { label: 'MRR', val: 'R$ 142.000', sub: 'Receita Recorrente' },
      { label: 'Custo p/ Aluno', val: 'R$ 312,00', sub: 'CAC + Operacional' },
      { label: 'Taxa de Churn', val: '2.8%', sub: 'Evasão mensal' }
    ],
    chart: [
      { month: 'Jan', revenue: 105000, expenses: 72000 },
      { month: 'Fev', revenue: 112000, expenses: 75000 },
      { month: 'Mar', revenue: 128000, expenses: 81000 },
      { month: 'Abr', revenue: 125000, expenses: 84000 },
      { month: 'Mai', revenue: 135000, expenses: 88000 },
      { month: 'Jun', revenue: 142000, expenses: 92000 },
      { month: 'Jul', revenue: 138000, expenses: 90000 },
      { month: 'Ago', revenue: 148000, expenses: 95000 },
      { month: 'Set', revenue: 155000, expenses: 98000 },
      { month: 'Out', revenue: 162000, expenses: 102000 },
    ],
    costs: [
      { name: 'Professores', value: 55000, color: '#8B5CF6' },
      { name: 'Marketing', value: 12000, color: '#10B981' },
      { name: 'Plataforma/SaaS', value: 8500, color: '#3B82F6' },
      { name: 'Operacional', value: 15000, color: '#6366F1' },
      { name: 'Outros', value: 11500, color: '#94A3B8' },
    ],
    dre: {
      bruta: "R$ 174.500,00",
      impostos: "R$ 12.100,00",
      liquida: "R$ 162.400,00",
      profs: "R$ 55.000,00",
      mkt: "R$ 12.000,00",
      ops: "R$ 23.500,00",
      lucro: "R$ 71.800,00",
      margem: "41.1%"
    }
  },
  trimestral: {
    kpis: {
      revenue: { value: "R$ 458.100,00", trendValue: "12.3%", trend: "up", subtitle: "Crescimento sólido" },
      expenses: { value: "R$ 285.400,00", trendValue: "5.1%", trend: "up", subtitle: "Equilíbrio operacional" },
      profit: { value: "R$ 172.700,00", trendValue: "15.8%", trend: "up", subtitle: "Margem: 37.7%" },
      default: { value: "R$ 22.150,00", trendValue: "1.5%", trend: "down", subtitle: "Taxa: 4.8%" }
    },
    secondary: [
      { label: 'Ticket Médio', val: 'R$ 472,00', sub: 'Média trimestral' },
      { label: 'Novos Alunos', val: '+124', sub: 'Média/mês: 41' },
      { label: 'Retenção', val: '97.2%', sub: 'NPS: 88' },
      { label: 'ROI Marketing', val: '4.2x', sub: 'Custo lead: R$ 12,50' }
    ],
    chart: [
      { month: 'T1 2024', revenue: 412000, expenses: 265000 },
      { month: 'T2 2024', revenue: 435000, expenses: 272000 },
      { month: 'T3 2024', revenue: 458000, expenses: 285000 },
    ],
    costs: [
      { name: 'Professores', value: 162000, color: '#8B5CF6' },
      { name: 'Marketing', value: 38000, color: '#10B981' },
      { name: 'SaaS', value: 24000, color: '#3B82F6' },
      { name: 'Operacional', value: 61400, color: '#6366F1' },
    ],
    dre: {
      bruta: "R$ 492.000,00",
      impostos: "R$ 33.900,00",
      liquida: "R$ 458.100,00",
      profs: "R$ 162.000,00",
      mkt: "R$ 38.000,00",
      ops: "R$ 85.400,00",
      lucro: "R$ 172.700,00",
      margem: "37.7%"
    }
  }
};
