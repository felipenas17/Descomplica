export const DEFAULT_LIST: any[] = [];
export const FORECAST_DATA: any[] = [];

export interface FinanceKPI { value: string; trendValue: string; trend: 'up' | 'down'; subtitle: string; }
export interface FinanceData { kpis: { revenue: FinanceKPI; expenses: FinanceKPI; profit: FinanceKPI; default: FinanceKPI; }; secondary: any[]; chart: any[]; costs: any[]; dre: Record<string, string>; }

const z: FinanceKPI = { value: "R$ 0,00", trendValue: "0%", trend: "up", subtitle: "Sem dados ainda" };
const empty: FinanceData = { kpis: { revenue: z, expenses: z, profit: z, default: z }, secondary: [], chart: [], costs: [], dre: { bruta: "R$ 0,00", impostos: "R$ 0,00", liquida: "R$ 0,00", profs: "R$ 0,00", mkt: "R$ 0,00", ops: "R$ 0,00", lucro: "R$ 0,00", margem: "0%" } };

export const PERIOD_DATA: Record<'mensal' | 'trimestral', FinanceData> = { mensal: empty, trimestral: empty };
