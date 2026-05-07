'use client';

import React, { useState, useMemo } from 'react';
import { 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  MoreVertical,
  Plus,
  FileText,
  PieChart as PieIcon,
  TrendingUp,
  Users,
  Wallet,
  AlertCircle,
  Calendar,
  MessageSquare,
  Search,
  CheckCircle2,
  BrainCircuit,
  Calculator,
  ArrowRight,
  Upload,
  Loader2,
  Minus,
  Bell,
  TrendingDown,
  Edit2,
  Trash2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import TransactionModal from '@/components/modals/TransactionModal';
import ImportModal from '@/components/modals/ImportModal';
import { supabase } from '@/lib/supabase';
import { useEffect, useCallback } from 'react';

// --- Types & Mock Data ---

const PERIOD_DATA = {
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
      revenue: { value: "R$ 485.200,00", trendValue: "12.2%", trend: "up", subtitle: "Q3 2023" },
      expenses: { value: "R$ 310.450,00", trendValue: "8.5%", trend: "up", subtitle: "Estável" },
      profit: { value: "R$ 174.750,00", trendValue: "15.4%", trend: "up", subtitle: "Margem: 36%" },
      default: { value: "R$ 22.150,00", trendValue: "5.2%", trend: "down", subtitle: "Melhoria em cobrança" }
    },
    secondary: [
      { label: 'Ticket Médio', val: 'R$ 492,00', sub: 'Média do trimestre' },
      { label: 'ARR (Est.)', val: 'R$ 1.9M', sub: 'Receita Anualizada' },
      { label: 'Custo Aquisição', val: 'R$ 840,00', sub: 'CAC por trimestre' },
      { label: 'Churn Trimestral', val: '7.2%', sub: 'Evasão Q3' }
    ],
    chart: [
      { month: 'Q1', revenue: 345000, expenses: 228000 },
      { month: 'Q2', revenue: 388000, expenses: 250000 },
      { month: 'Q3', revenue: 485200, expenses: 310450 },
      { month: 'Q4 (Enc.)', revenue: 520000, expenses: 330000 },
    ],
    costs: [
      { name: 'Professores', value: 165000, color: '#8B5CF6' },
      { name: 'Marketing', value: 45000, color: '#10B981' },
      { name: 'Plataforma/SaaS', value: 25500, color: '#3B82F6' },
      { name: 'Operacional', value: 42000, color: '#6366F1' },
      { name: 'Outros', value: 32950, color: '#94A3B8' },
    ],
    dre: {
      bruta: "R$ 510.800,00",
      impostos: "R$ 25.600,00",
      liquida: "R$ 485.200,00",
      profs: "R$ 165.000,00",
      mkt: "R$ 45.000,00",
      ops: "R$ 67.500,00",
      lucro: "R$ 207.700,00",
      margem: "42.8%"
    }
  },
  anual: {
    kpis: {
      revenue: { value: "R$ 1.84M", trendValue: "24.5%", trend: "up", subtitle: "Ano Fiscal 2023" },
      expenses: { value: "R$ 1.12M", trendValue: "15.2%", trend: "up", subtitle: "Investimento Expansão" },
      profit: { value: "R$ 720k", trendValue: "38.1%", trend: "up", subtitle: "Margem: 39.1%" },
      default: { value: "R$ 84.500", trendValue: "1.2%", trend: "down", subtitle: "Meta: < 5%" }
    },
    secondary: [
      { label: 'LTV', val: 'R$ 5.820', sub: 'Lifetime Value' },
      { label: 'Faturamento Anual', val: 'R$ 1.84M', sub: 'Consolidado' },
      { label: 'ROI Marketing', val: '4.2x', sub: 'Retorno sobre investimento' },
      { label: 'Crescimento', val: '42%', sub: 'YoY' }
    ],
    chart: [
      { month: '2020', revenue: 850000, expenses: 620000 },
      { month: '2021', revenue: 1120000, expenses: 840000 },
      { month: '2022', revenue: 1480000, expenses: 980000 },
      { month: '2023', revenue: 1840000, expenses: 1120000 },
    ],
    costs: [
      { name: 'Professores', value: 620000, color: '#8B5CF6' },
      { name: 'Marketing', value: 180000, color: '#10B981' },
      { name: 'Plataforma/SaaS', value: 95000, color: '#3B82F6' },
      { name: 'Operacional', value: 150000, color: '#6366F1' },
      { name: 'Outros', value: 75000, color: '#94A3B8' },
    ],
    dre: {
      bruta: "R$ 1.95M",
      impostos: "R$ 110k",
      liquida: "R$ 1.84M",
      profs: "R$ 620k",
      mkt: "R$ 180k",
      ops: "R$ 245k",
      lucro: "R$ 795k",
      margem: "43.2%"
    }
  }
} as const;

const FORECAST_DATA = [
  { day: '05/Nov', type: 'Saída', amount: 4500, label: 'Folha Pagamento Part.' },
  { day: '10/Nov', type: 'Entrada', amount: 42000, label: 'Mensalidades Lote 01' },
  { day: '15/Nov', type: 'Saída', amount: 8200, label: 'Aluguel Unidade Central' },
  { day: '20/Nov', type: 'Entrada', amount: 15500, label: 'Aulas Particulares' },
  { day: '25/Nov', type: 'Saída', amount: 3100, label: 'Links Patrocinados' },
];

const DEFAULT_LIST = [
  { id: 1, name: 'Lucas Bertoldi', amount: 1450, daysLate: 42, status: 'Crítico' },
  { id: 2, name: 'Mariana Duarte', amount: 980, daysLate: 15, status: 'Alerta' },
  { id: 3, name: 'Roberto Júnio', amount: 1200, daysLate: 8, status: 'Recent' },
  { id: 4, name: 'Clara Meireles', amount: 2400, daysLate: 65, status: 'Crítico' },
];

// --- Components ---

const KPICard = ({ title, value, icon: Icon, trend, trendValue, colorClass, subtitle }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="glass-card p-6 rounded-[2rem] border border-primary/5 shadow-xl shadow-primary/5 relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 opacity-5 rounded-full transition-transform group-hover:scale-150 ${colorClass}`}></div>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 text-opacity-100`}>
        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-[10px] font-extrabold px-3 py-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trendValue}
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-display font-extrabold text-gray-900 mt-1">{value}</h3>
      {subtitle && <p className="text-[10px] text-gray-400 mt-1 font-bold">{subtitle}</p>}
    </div>
  </motion.div>
);

export default function FinanceView() {
  const [period, setPeriod] = useState<'mensal' | 'trimestral' | 'anual'>('mensal');
  const [simulatorValue, setSimulatorValue] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'revenue' | 'expense'>('revenue');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchTransactions = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials missing. Please check your .env file.');
      setLoadingTransactions(false);
      setSyncError('Credentials Missing');
      setTransactions([]);
      return;
    }
    
    setLoadingTransactions(true);
    setSyncError(null);
    try {
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .order('due_date', { ascending: false });
      
      if (error) {
        const errObj = error as any;
        const msg = errObj.message || 'Unknown error';
        const code = errObj.code || 'No code';
        
        console.error(`Supabase Error [${code}]: ${msg}`);
        
        if (code === '42P01' || code === 'PGRST125') {
          setSyncError('Schema Sync Error');
          console.error('⚠️ DICA SUPABASE: Se o erro persistir mesmo com a tabela criada, vá em Settings -> API no painel do Supabase e clique em "Save" (salvar) para forçar o reinício do cache da API.');
        } else {
          setSyncError(msg);
        }
        
        setLoadingTransactions(false);
        setTransactions([]); 
        return;
      }
      setTransactions(data || []);
      setSyncError(null);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setSyncError(error.message);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTransactions();
  }, [fetchTransactions]);

  const currentData = PERIOD_DATA[period];

  const handleOpenModal = (type: 'revenue' | 'expense') => {
    setEditingTransaction(null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setModalType(transaction.type);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Deseja realmente excluir este lançamento?')) return;
    
    try {
      const { error } = await supabase
        .from('finances')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir lançamento.');
    }
  };

  const updateTransactionStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('finances')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const smartAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(today.getDate() + 2);
    twoDaysFromNow.setHours(23, 59, 59, 999);

    const accountsDueToday = transactions.filter(t => 
      t.status !== 'Pago' && 
      new Date(t.due_date).toDateString() === today.toDateString()
    );

    const overduePayments = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return t.status !== 'Pago' && dueDate < today;
    });

    const upcomingRevenues = transactions.filter(t => 
      t.type === 'revenue' && 
      t.status !== 'Pago' &&
      new Date(t.due_date) <= twoDaysFromNow &&
      new Date(t.due_date) > today
    );

    return {
      dueToday: accountsDueToday.length,
      overdue: overduePayments.length,
      upcoming: upcomingRevenues.length
    };
  }, [transactions]);

  const insights = useMemo(() => {
    if (transactions.length === 0) return null;

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const totalRevenue = transactions
      .filter(t => t.type === 'revenue' && t.status === 'Pago')
      .reduce((acc, t) => acc + t.value, 0);

    const fixedCosts = transactions
      .filter(t => t.type === 'expense' && t.cost_type === 'Fixo')
      .reduce((acc, t) => acc + t.value, 0);

    const nextSevenDaysExpenses = transactions
      .filter(t => 
        t.type === 'expense' && 
        t.status === 'Pendente' && 
        new Date(t.due_date) >= today && 
        new Date(t.due_date) <= sevenDaysFromNow
      )
      .reduce((acc, t) => acc + t.value, 0);

    const fixedCostPercentage = totalRevenue > 0 ? ((fixedCosts / totalRevenue) * 100).toFixed(1) : '0';

    return {
      fixedCostPercentage,
      upcomingExpenses: nextSevenDaysExpenses,
      defaultRisk: transactions.filter(t => t.type === 'revenue' && t.status === 'Atrasado').length > 0 ? '5.2%' : '0%'
    };
  }, [transactions]);

  const kpis = useMemo(() => {
    const totalRevenue = transactions
      .filter(t => t.type === 'revenue' && t.status === 'Pago')
      .reduce((acc, t) => acc + t.value, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense' && t.status === 'Pago')
      .reduce((acc, t) => acc + t.value, 0);

    const totalDefault = transactions
      .filter(t => t.type === 'revenue' && t.status === 'Atrasado')
      .reduce((acc, t) => acc + t.value, 0);

    // If we have real data, use it. Otherwise fallback to mock for demo.
    const hasData = transactions.length > 0;

    return {
      revenue: hasData ? `R$ ${totalRevenue.toLocaleString('pt-BR')}` : currentData.kpis.revenue.value,
      expenses: hasData ? `R$ ${totalExpenses.toLocaleString('pt-BR')}` : currentData.kpis.expenses.value,
      profit: hasData ? `R$ ${(totalRevenue - totalExpenses).toLocaleString('pt-BR')}` : currentData.kpis.profit.value,
      default: hasData ? `R$ ${totalDefault.toLocaleString('pt-BR')}` : currentData.kpis.default.value,
      margin: hasData ? ((totalRevenue - totalExpenses) / (totalRevenue || 1) * 100).toFixed(1) : currentData.kpis.profit.subtitle.split(': ')[1]
    };
  }, [transactions, currentData]);

  const handleDownloadReport = () => {
    setDownloadingReport(true);
    // Simulating PDF generation
    setTimeout(() => {
      setDownloadingReport(false);
      const reportName = `Relatorio_Financeiro_${period.toUpperCase()}_2024.pdf`;
      
      // Real download trigger logic
      const reportHeader = `RELATÓRIO FINANCEIRO ESTRATÉGICO - 2024\n`;
      const reportMeta = `Período: ${period.toUpperCase()}\nData de Geração: ${new Date().toLocaleString()}\n\n`;
      const reportData = `Receita: ${currentData.kpis.revenue.value}\nDespesas: ${currentData.kpis.expenses.value}\nLucro: ${currentData.kpis.profit.value}\n`;
      
      const content = reportHeader + reportMeta + reportData;
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = reportName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`O relatório "${reportName}" foi gerado com sucesso!`);
    }, 1500);
  };

  const simulationImpact = useMemo(() => {
    const currentRevenue = 162000;
    const currentProfit = 60000;
    const increase = (simulatorValue / 100) * currentRevenue;
    const newRevenue = currentRevenue + increase;
    const newProfit = currentProfit + increase;
    return {
      revenue: newRevenue,
      profit: newProfit,
      margin: ((newProfit / newRevenue) * 100).toFixed(1)
    };
  }, [simulatorValue]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // Simulating file processing
    setTimeout(() => {
      setUploading(false);
      alert('Extrato bancário processado com sucesso! Seus gráficos foram atualizados.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 2000);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Main Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-display font-black text-primary">CFO Dashboard</h1>
          <p className="text-sm text-gray-500 font-medium">Gestão Estratégica e Saúde Financeira</p>
          {syncError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-50 border border-red-100 px-6 py-4 rounded-3xl flex flex-col md:flex-row items-center gap-4 max-w-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 text-white rounded-xl">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-red-600 uppercase tracking-widest">Erro Crítico de Sincronização (PGRST125)</p>
                  <p className="text-[11px] font-bold text-gray-600 leading-tight">O Supabase não está reconhecendo sua tabela &apos;finances&apos;.</p>
                </div>
              </div>
              <div className="flex gap-2 ml-auto">
                <button 
                  onClick={() => {
                    alert("⚠️ SOLUÇÃO DEFINITIVA (PGRST125):\n\n1. Verifique sua URL no .env:\n   Ela deve ser apenas https://xyz.supabase.co (NÃO pode terminar em /rest/v1).\n\n2. Execute este SQL 'Nuclear' no Editor do Supabase:\n\n   -- Renascer tabela\n   ALTER TABLE IF EXISTS public.finances RENAME TO finances_old;\n   ALTER TABLE IF EXISTS public.finances_old RENAME TO finances;\n\n   -- Forçar Permissões\n   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;\n   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;\n\n3. Vá em Settings -> API e clique em 'SAVE' para limpar o cache.");
                  }}
                  className="px-4 py-2 bg-white border border-red-100 rounded-xl text-[10px] font-black text-red-600 hover:bg-red-50 transition-all uppercase tracking-tighter"
                >
                  Ver Solução
                </button>
                <button 
                  onClick={() => {
                    setLoadingTransactions(true);
                    setTimeout(() => window.location.reload(), 500);
                  }}
                  className="px-4 py-2 bg-red-500 rounded-xl text-[10px] font-black text-white hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter shadow-lg shadow-red-500/20"
                >
                  Reiniciar App
                </button>
              </div>
            </motion.div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-white/50 p-2 rounded-3xl border border-primary/5 shadow-sm">
          <div className="flex bg-gray-100/50 p-1 rounded-2xl">
            {['mensal', 'trimestral', 'anual'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${period === p ? 'bg-white shadow-md text-primary' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {p}
              </button>
            ))}
          </div>

          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            accept=".csv,.ofx,.xlsx"
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-primary/10 text-primary rounded-2xl text-sm font-bold hover:bg-primary/5 transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {uploading ? 'Processando...' : 'Importar Extrato'}
          </button>

          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-secondary text-black rounded-2xl text-sm font-bold shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Upload size={18} /> Importar Planilha
          </button>

          <button 
            onClick={() => handleOpenModal('revenue')}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} /> Nova Receita
          </button>
          
          <button 
            onClick={() => handleOpenModal('expense')}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Minus size={18} /> Nova Despesa
          </button>

          <button 
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {downloadingReport ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {downloadingReport ? 'Gerando PDF...' : 'Relatório PDF'}
          </button>
        </div>
      </div>

      {/* SMART ALERTS SECTION */}
      {(smartAlerts.dueToday > 0 || smartAlerts.overdue > 0 || smartAlerts.upcoming > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {smartAlerts.dueToday > 0 && (
            <div className="bg-orange-50 border border-orange-100 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/20">
                <Bell size={24} />
              </div>
              <div>
                <p className="text-orange-600 text-xs font-black uppercase tracking-widest">{smartAlerts.dueToday} Contas vencem hoje</p>
                <p className="text-gray-600 text-[10px] font-bold">Verifique o fluxo de caixa para pagamentos.</p>
              </div>
            </div>
          )}
          {smartAlerts.overdue > 0 && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-red-600 text-xs font-black uppercase tracking-widest">{smartAlerts.overdue} Pagamentos atrasados</p>
                <p className="text-gray-600 text-[10px] font-bold">Inicie as ações de cobrança agora.</p>
              </div>
            </div>
          )}
          {smartAlerts.upcoming > 0 && (
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-blue-600 text-xs font-black uppercase tracking-widest">{smartAlerts.upcoming} Receitas previstas (48h)</p>
                <p className="text-gray-600 text-[10px] font-bold">Faturamento de mensalidades em lote.</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* KPI GRID - TOP 4 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Receita Total" 
          value={kpis.revenue} 
          icon={Wallet} 
          trend={currentData.kpis.revenue.trend} 
          trendValue={currentData.kpis.revenue.trendValue} 
          colorClass="bg-primary"
          subtitle={currentData.kpis.revenue.subtitle}
        />
        <KPICard 
          title="Despesas Totais" 
          value={kpis.expenses} 
          icon={ArrowDownRight} 
          trend={currentData.kpis.expenses.trend} 
          trendValue={currentData.kpis.expenses.trendValue} 
          colorClass="bg-red-500"
          subtitle={currentData.kpis.expenses.subtitle}
        />
        <KPICard 
          title="Lucro Líquido" 
          value={kpis.profit} 
          icon={TrendingUp} 
          trend={currentData.kpis.profit.trend} 
          trendValue={currentData.kpis.profit.trendValue} 
          colorClass="bg-green-500"
          subtitle={`Margem: ${kpis.margin}%`}
        />
        <KPICard 
          title="Inadimplência" 
          value={kpis.default} 
          icon={AlertCircle} 
          trend={currentData.kpis.default.trend} 
          trendValue={currentData.kpis.default.trendValue} 
          colorClass="bg-red-600"
          subtitle={currentData.kpis.default.subtitle}
        />
      </section>

      {/* SECONDARY KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {currentData.secondary.map((k) => (
          <div key={k.label} className="bg-white/40 p-5 rounded-2xl border border-primary/5">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{k.label}</p>
            <p className="text-xl font-bold text-gray-900">{k.val}</p>
            <p className="text-[9px] text-gray-400 font-medium">{k.sub}</p>
          </div>
        ))}
      </section>

      {/* MAIN CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass-card p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-bold font-display text-gray-900">Fluxo ({period})</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Comparativo Receita vs Despesas</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/20"></div>
                <span className="text-[10px] font-bold text-gray-500">Receita</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 shadow-lg shadow-red-400/20"></div>
                <span className="text-[10px] font-bold text-gray-500">Despesas</span>
              </div>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData.chart as any}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94A3B8' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94A3B8' }}
                  tickFormatter={(val) => `R$ ${val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : (val/1000).toFixed(0) + 'k'}`}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                <Line type="monotone" dataKey="expenses" stroke="#F87171" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           {/* COST DONUT */}
           <div className="glass-card p-10 rounded-[2.5rem] flex flex-col items-center shadow-sm">
              <h3 className="text-xl font-bold font-display mb-6 text-gray-900">Distribuição</h3>
              <div className="w-56 h-56 relative mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={currentData.costs} 
                      innerRadius="75%" 
                      outerRadius="100%" 
                      paddingAngle={5} 
                      dataKey="value"
                      stroke="none"
                    >
                      {currentData.costs.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-gray-900 truncate px-4">{currentData.kpis.expenses.value}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{period}</span>
                </div>
              </div>
              <div className="w-full space-y-3">
                {currentData.costs.map(item => (
                  <div key={item.name} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-900">R$ {(item.value/1000).toFixed(1)}k</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* DETAILED DRE SECTION */}
        <div className="lg:col-span-8 glass-card rounded-[2.5rem] overflow-hidden shadow-sm border border-primary/5">
          <div className="p-8 border-b border-primary/5 bg-primary/5 flex justify-between items-center">
             <div>
               <h3 className="text-2xl font-bold font-display text-gray-900">DRE Estratégico</h3>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Visão completa ({period})</p>
             </div>
             <button className="text-primary hover:bg-primary/10 p-3 rounded-2xl transition-all">
                <MoreVertical size={20} />
             </button>
          </div>
          <div className="p-2 overflow-x-auto">
            <table className="w-full text-sm font-medium">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase font-black border-b border-primary/5">
                  <th className="px-6 py-5 text-left">Categoria</th>
                  <th className="px-6 py-5 text-right">Valor (R$)</th>
                  <th className="px-6 py-5 text-right">% Receita</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-primary/5 font-bold"><td className="px-6 py-4 text-gray-900">Receita Bruta Total</td><td className="px-6 py-4 text-right text-gray-900">{currentData.dre.bruta}</td><td className="px-6 py-4 text-right text-gray-900">100%</td></tr>
                <tr className="text-red-400"><td className="px-6 py-4">(-) Impostos s/ Faturamento</td><td className="px-6 py-4 text-right">{currentData.dre.impostos}</td><td className="px-6 py-4 text-right">6.9%</td></tr>
                <tr className="border-b border-primary/5 font-extrabold text-primary"><td className="px-6 py-4">RECEITA LÍQUIDA</td><td className="px-6 py-4 text-right">{currentData.dre.liquida}</td><td className="px-6 py-4 text-right">93.1%</td></tr>
                
                <tr className="text-gray-900"><td className="px-6 py-4 pl-10 font-bold">Custos: Professores</td><td className="px-6 py-4 text-right">{currentData.dre.profs}</td><td className="px-6 py-4 text-right">-</td></tr>
                <tr className="text-gray-700"><td className="px-6 py-4 pl-10">Custos: Marketing</td><td className="px-6 py-4 text-right">{currentData.dre.mkt}</td><td className="px-6 py-4 text-right">-</td></tr>
                <tr className="text-gray-700 border-b border-primary/5"><td className="px-6 py-4 pl-10">Custos: Plataforma / Operacional</td><td className="px-6 py-4 text-right">{currentData.dre.ops}</td><td className="px-6 py-4 text-right">-</td></tr>
                
                <tr className="bg-green-500 text-white font-black text-lg">
                  <td className="px-6 py-8 rounded-bl-[2rem]">LUCRO LÍQUIDO FINAL</td>
                  <td className="px-6 py-8 text-right">{currentData.dre.lucro}</td>
                  <td className="px-6 py-8 text-right rounded-br-[2rem]">{currentData.dre.margem}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* REAL TRANSACTIONS LIST */}
        <div className="lg:col-span-12 glass-card p-10 rounded-[2.5rem] shadow-sm border border-primary/5">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold font-display text-gray-900">Lançamentos Recentes</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Histórico de Movimentações</p>
            </div>
            <div className="flex gap-2">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                 <input 
                   type="text" 
                   placeholder="Buscar lançamento..." 
                   className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                 />
               </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-medium">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase font-black border-b border-primary/5 text-left">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {loadingTransactions ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-primary mb-4" size={32} />
                      <p className="text-sm font-bold text-gray-400">Carregando dados...</p>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="p-6 bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Wallet className="text-gray-300" size={32} />
                      </div>
                      <p className="text-sm font-bold text-gray-900">Nenhum lançamento encontrado</p>
                      <p className="text-xs text-gray-400 mt-1">Comece adicionando uma nova receita ou despesa.</p>
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 10).map((t) => {
                    const isOverdue = t.status !== 'Pago' && new Date(t.due_date) < new Date(new Date().setHours(0,0,0,0));
                    const displayStatus = t.status === 'Pago' ? 'Pago' : (isOverdue ? 'Atrasado' : 'Pendente');
                    
                    return (
                      <tr key={t.id} className="border-b border-gray-50 group hover:bg-gray-50 transition-all">
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            displayStatus === 'Pago' ? 'bg-green-100 text-green-600' : 
                            displayStatus === 'Atrasado' ? 'bg-red-100 text-red-600' : 
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${t.type === 'revenue' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {t.type === 'revenue' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            </div>
                            <div>
                              <p className="text-gray-900 font-bold">{t.description}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{t.payment_method}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-bold text-xs">{t.category}</td>
                        <td className="px-6 py-4 text-gray-900 font-bold text-xs">
                          {new Date(t.due_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-black ${t.type === 'revenue' ? 'text-green-600' : 'text-red-500'}`}>
                            {t.type === 'revenue' ? '+' : '-'} R$ {t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {t.status !== 'Pago' && (
                              <button 
                                onClick={() => updateTransactionStatus(t.id, 'Pago')}
                                className="px-3 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-lg hover:scale-105 transition-all shadow-sm shadow-green-200"
                              >
                                PAGAR
                              </button>
                            )}
                            <button 
                              onClick={() => handleEditTransaction(t)}
                              className="p-2 hover:bg-primary/10 rounded-xl text-gray-400 hover:text-primary transition-all"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/*professores / inadimplecia etc */}
        <div className="lg:col-span-4 glass-card p-10 rounded-[2.5rem] shadow-sm flex flex-col border border-red-100">
           <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold font-display text-gray-900 text-red-500">Inadimplência</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ações de Cobrança</p>
              </div>
              <div className="p-3 bg-red-100 text-red-500 rounded-2xl">
                 <AlertCircle size={20} />
              </div>
           </div>
           
           <div className="flex-1 space-y-6">
              {DEFAULT_LIST.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 group">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${item.status === 'Crítico' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                          {item.status}
                       </span>
                       <span className="text-[10px] text-gray-400 font-bold">-{item.daysLate} dias</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">R$ {item.amount}</p>
                    <div className="flex gap-2 mt-2">
                       <button onClick={() => alert("Função de contato em breve!")} className="p-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all">
                          <MessageSquare size={14} />
                       </button>
                       <button onClick={() => alert("Função de validar em breve!")} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all">
                          <CheckCircle2 size={14} />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
           </div>
           
           <button onClick={() => alert("Relatório em breve!")} className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-bold shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-95 transition-all mt-8">
              Visualizar Relatório Completo (Em breve)
           </button>
        </div>
      </div>

      {/* BOTTOM TOOLS: FORECAST, AI INSIGHTS & SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CASH FLOW FORECAST */}
        <div className="glass-card p-10 rounded-[2.5rem] shadow-sm">
           <div className="flex items-center gap-3 mb-8">
              <Calendar className="text-primary" size={24} />
              <div>
                 <h4 className="text-lg font-bold font-display">Previsão 30 Dias</h4>
                 <p className="text-[10px] text-gray-400 font-bold uppercase">Entradas vs Saídas</p>
              </div>
           </div>
           <div className="space-y-6">
              {FORECAST_DATA.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-gray-50 flex flex-col items-center justify-center border border-gray-100">
                      <span className="text-[8px] font-black text-gray-400">{item.day.split('/')[1]}</span>
                      <span className="text-xs font-black text-primary">{item.day.split('/')[0]}</span>
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">{item.label}</p>
                      <p className={`text-[10px] font-bold ${item.type === 'Entrada' ? 'text-green-500' : 'text-red-400'}`}>{item.type}</p>
                   </div>
                   <p className={`text-sm font-black ${item.type === 'Entrada' ? 'text-green-600' : 'text-gray-900'}`}>
                      {item.type === 'Entrada' ? '+' : '-'} R$ {item.amount}
                   </p>
                </div>
              ))}
           </div>
        </div>

        {/* AI INSIGHTS */}
        <div className="bg-gray-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-primary opacity-5 group-hover:opacity-10 transition-opacity"></div>
           <BrainCircuit className="text-primary mb-6 animate-pulse" size={40} />
           <h4 className="text-2xl font-display font-black mb-8">Gestão Inteligente</h4>
           <div className="space-y-6">
              {insights ? (
                <>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                     <p className="text-[10px] font-black text-primary uppercase mb-1">Análise de Custos</p>
                     <p className="text-xs text-gray-300 font-medium leading-relaxed">
                        Seu custo fixo representa <span className="text-white font-bold">{insights.fixedCostPercentage}%</span> da receita líquida atual.
                     </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                     <p className="text-[10px] font-black text-green-400 uppercase mb-1">Previsão Próximos 7 Dias</p>
                     <p className="text-xs text-gray-300 font-medium leading-relaxed">
                        Você tem <span className="text-white font-bold">R$ {insights.upcomingExpenses.toLocaleString('pt-BR')}</span> a pagar na próxima semana.
                     </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                     <p className="text-[10px] font-black text-red-400 uppercase mb-1">Monitoramento de Risco</p>
                     <p className="text-xs text-gray-300 font-medium leading-relaxed">
                        Sua taxa de inadimplência ativa é de <span className="text-white font-bold">{insights.defaultRisk}</span>. Fique atento aos atrasos.
                     </p>
                  </div>
                </>
              ) : (
                <div className="bg-white/5 p-6 rounded-2xl border border-dashed border-white/10 text-center">
                   <p className="text-xs text-gray-400 font-medium">
                      Adicione seus primeiros lançamentos para gerar insights automáticos baseados em dados reais.
                   </p>
                </div>
              )}
           </div>
        </div>

        {/* PROFIT SIMULATOR */}
        <div className="glass-card p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-3 mb-8">
                <Calculator className="text-secondary" size={24} />
                <div>
                   <h4 className="text-lg font-bold font-display">Simulador de Impacto</h4>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Previsão de Lucro</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-10">
                O que acontece se você aumentar o ticket médio em <span className="font-black text-gray-900">{simulatorValue}%</span>?
              </p>
              
              <input 
                type="range" 
                min="0" 
                max="50" 
                value={simulatorValue} 
                onChange={(e) => setSimulatorValue(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-primary mb-12"
              />
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center p-5 bg-primary/5 rounded-2xl">
                 <span className="text-xs font-bold text-gray-500">Nova Receita</span>
                 <span className="text-lg font-black text-primary">R$ {(simulationImpact.revenue/1000).toFixed(1)}k</span>
              </div>
              <div className="flex justify-between items-center p-5 bg-green-500/5 rounded-2xl">
                 <span className="text-xs font-bold text-gray-500">Novo Lucro</span>
                 <div className="text-right">
                    <span className="text-lg font-black text-green-600 block">R$ {(simulationImpact.profit/1000).toFixed(1)}k</span>
                    <span className="text-[10px] font-bold text-green-500">+{simulationImpact.margin}% Margem</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        type={modalType}
        transaction={editingTransaction}
        onSuccess={fetchTransactions}
      />

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
