'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  Plus,
  TrendingUp,
  Wallet,
  AlertCircle,
  Calendar,
  Search,
  BrainCircuit,
  Calculator,
  Loader2,
  TrendingDown,
  Edit2,
  Trash2,
  Upload
} from 'lucide-react';

import TransactionModal from '@/components/modals/TransactionModal';
import ImportModal from '@/components/modals/ImportModal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { FinanceKPI } from './finance/FinanceKPI';
import { FinanceInadimplencia } from './finance/FinanceInadimplencia';
import { DEFAULT_LIST, FORECAST_DATA } from '@/lib/finance-mock';

// Dynamic import for charts for performance
const FinanceCharts = dynamic(() => import('./finance/FinanceCharts'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-[2.5rem]" />
});

export default function FinanceView() {
  const [period, setPeriod] = useState<'mensal' | 'trimestral'>('mensal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'revenue' | 'expense'>('revenue');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'revenue' | 'expenses'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [simulatorValue, setSimulatorValue] = useState(15);
  const [fetchError, setFetchError] = useState<{ message: string; details?: string; code?: string } | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      if (!isSupabaseConfigured) {
        console.warn('[FinanceView] Supabase not configured. Using mock data.');
        const mockData = [
          { id: 'sim-1', description: 'Mensalidades Abril', amount: 45000, type: 'receita', category: 'Mensalidades', date: '2024-04-10', status: 'Pago' },
          { id: 'sim-2', description: 'Aluguel Unidade Central', amount: 12000, type: 'despesa', category: 'Operacional', date: '2024-04-05', status: 'Pago' },
          { id: 'sim-3', description: 'Salários Professores', amount: 35000, type: 'despesa', category: 'Pessoal', date: '2024-04-20', status: 'Pendente' },
          { id: 'sim-4', description: 'Venda de Material Didático', amount: 8500, type: 'receita', category: 'Materiais', date: '2024-04-15', status: 'Pago' },
        ];
        setTransactions(mockData);
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          students!student_id(name)
        `)
        .order('date', { ascending: false });

      if (error) {
        // Se falhar por causa do JOIN (relação não encontrada), tenta buscar sem o join
        if (error.code === 'PGRST200') {
          console.warn('[FinanceView] Relacionamento com students não encontrado. Buscando apenas transações.');
          const { data: simpleData, error: simpleError } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });
          
          if (simpleError) throw simpleError;
          setTransactions(simpleData || []);
          return;
        }
        
        // Detailed logging as requested
        console.error('[FinanceView] Erro detalhado ao buscar transações:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          raw: error
        });
        throw error;
      }
      
      setTransactions(data || []);
    } catch (err: any) {
      const errorObj = {
        message: err.message || 'Erro desconhecido ao carregar dados financeiros.',
        details: err.details || '',
        code: err.code || ''
      };
      setFetchError(errorObj);
      console.error('[FinanceView] Erro capturado no catch:', JSON.stringify(err, null, 2));
      
      // Fallback para dados de simulação em caso de erro
      setTransactions([
        { id: 'sim-1', description: 'Mensalidades Abril', amount: 45000, type: 'receita', category: 'Mensalidades', date: '2024-04-10', status: 'Pago' },
        { id: 'sim-2', description: 'Aluguel Unidade Central', amount: 12000, type: 'despesa', category: 'Operacional', date: '2024-04-05', status: 'Pago' },
        { id: 'sim-3', description: 'Salários Professores', amount: 35000, type: 'despesa', category: 'Pessoal', date: '2024-04-20', status: 'Pendente' },
        { id: 'sim-4', description: 'Venda de Material Didático', amount: 8500, type: 'receita', category: 'Materiais', date: '2024-04-15', status: 'Pago' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const kpis = useMemo(() => {
    const revenue = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + Number(t.amount), 0);
    const profit = revenue - expenses;

    return {
      revenue: { value: `R$ ${(revenue/1000).toFixed(1)}k`, trend: 'up', trendValue: '+12%', subtitle: 'vs mês anterior' },
      expenses: { value: `R$ ${(expenses/1000).toFixed(1)}k`, trend: 'down', trendValue: '-5%', subtitle: 'vs mês anterior' },
      profit: { value: `R$ ${(profit/1000).toFixed(1)}k`, trend: 'up', trendValue: '+8%', subtitle: 'margem de 22%' },
      default: { value: '4.2%', trend: 'down', trendValue: '-1.5%', subtitle: 'taxa controlada' }
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (t.category?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || 
                        (activeTab === 'revenue' && t.type === 'receita') ||
                        (activeTab === 'expenses' && t.type === 'despesa');
      return matchesSearch && matchesTab;
    });
  }, [transactions, searchTerm, activeTab]);

  const updateTransactionStatus = async (id: string, newStatus: string) => {
    if (id.toString().startsWith('sim-')) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      return;
    }
    try {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('transactions').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchTransactions();
    } catch (err) {
      console.error('[FinanceView] Erro ao atualizar:', err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (id.toString().startsWith('sim-')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      return;
    }
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      fetchTransactions();
    } catch (err) {
      console.error('[FinanceView] Erro ao excluir:', err);
    }
  };

  const handleEditTransaction = (t: any) => {
    setEditingTransaction(t);
    setModalType(t.type);
    setIsModalOpen(true);
  };

  const simulationImpact = useMemo(() => {
    const revenue = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + Number(t.amount), 0);
    const profit = revenue - expenses;
    const impact = simulatorValue / 100;
    
    const newRevenue = revenue * (1 + impact);
    const newProfit = profit + (revenue * impact);
    const margin = newRevenue > 0 ? ((newProfit / newRevenue) * 100).toFixed(1) : "0";

    return {
      revenue: newRevenue,
      profit: newProfit,
      margin
    };
  }, [transactions, simulatorValue]);

  const { chartData, costsData } = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const chart = months.map(m => ({ month: m, revenue: 0, expenses: 0 }));
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const mIdx = date.getMonth() % 6;
      if (t.type === 'receita') chart[mIdx].revenue += Number(t.amount);
      else chart[mIdx].expenses += Number(t.amount);
    });

    const catMap: Record<string, number> = {};
    transactions.filter(t => t.type === 'despesa').forEach(t => {
      const cat = t.category || 'Outros';
      catMap[cat] = (catMap[cat] || 0) + Number(t.amount);
    });

    const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
    const costs = Object.entries(catMap).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));

    return { 
      chartData: chart, 
      costsData: costs.length > 0 ? costs : [{ name: 'Sem dados', value: 1, color: '#f3f4f6' }] 
    };
  }, [transactions]);

  const insights = useMemo(() => {
    if (transactions.length === 0) return null;
    const rev = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0);
    const exp = transactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + Number(t.amount), 0);
    return {
      fixedCostPercentage: rev > 0 ? ((exp / rev) * 100).toFixed(1) : "0",
      upcomingExpenses: transactions.filter(t => t.type === 'despesa' && t.status === 'Pendente').reduce((acc, t) => acc + Number(t.amount), 0),
      defaultRisk: "Médio"
    };
  }, [transactions]);

  return (
    <div className="space-y-10 pb-20 max-w-[1600px] mx-auto px-4 md:px-8">
      {/* ERROR BANNER */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="text-red-500 shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="text-sm font-black text-red-900 uppercase tracking-widest mb-1">Erro de Conexão</h3>
            <p className="text-xs text-red-700 font-bold mb-2">
              Não foi possível sincronizar com a base de dados em tempo real. Exibindo dados de simulação.
            </p>
            <div className="bg-red-100/50 p-3 rounded-xl">
               <p className="text-[10px] font-mono text-red-900 break-all">
                 <span className="font-black">Motivo:</span> {fetchError.message}
                 {fetchError.code && <span className="ml-2 bg-red-200 px-1.5 py-0.5 rounded">Código: {fetchError.code}</span>}
               </p>
               {fetchError.details && (
                 <p className="text-[10px] font-mono text-red-800 mt-1">
                   <span className="font-black">Detalhes:</span> {fetchError.details}
                 </p>
               )}
            </div>
            <button 
              onClick={() => fetchTransactions()}
              className="mt-4 text-[10px] font-black text-red-900 bg-red-200/50 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors border border-red-300/50"
            >
              RECONECTAR AGORA
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-1 md:w-12 bg-primary rounded-full" />
            <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Módulo Financeiro</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none font-display">Operacional <span className="font-light italic">&</span> DRE</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl flex items-center shadow-sm border border-gray-100">
            {(['hoje', 'semanal', 'mensal', 'anual'] as const).map((p) => (
              <button 
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  period === p ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-100 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Upload size={16} className="text-secondary" />
            Importar Documentos
          </button>

          <button 
            onClick={() => { setModalType('revenue'); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={18} />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-4">
        <FinanceKPI label="Receita Bruta" value={kpis.revenue.value} trend={kpis.revenue.trend} trendValue={kpis.revenue.trendValue} subtitle={kpis.revenue.subtitle} icon={TrendingUp} color="bg-secondary" />
        <FinanceKPI label="Despesas Operacionais" value={kpis.expenses.value} trend={kpis.expenses.trend} trendValue={kpis.expenses.trendValue} subtitle={kpis.expenses.subtitle} icon={TrendingDown} color="bg-rose-500" />
        <FinanceKPI label="Lucro Líquido" value={kpis.profit.value} trend={kpis.profit.trend} trendValue={kpis.profit.trendValue} subtitle={kpis.profit.subtitle} icon={Wallet} color="bg-primary" />
        <FinanceKPI label="Inadimplência" value={kpis.default.value} trend={kpis.default.trend} trendValue={kpis.default.trendValue} subtitle={kpis.default.subtitle} icon={AlertCircle} color="bg-orange-500" />
      </div>

      {/* CHARTS SECTION */}
            <FinanceCharts chartData={chartData} costsData={costsData} />

      {/* MIDDLE SECTION: TRANSACTIONS & DRE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* TRANSACTIONS TABLE */}
        <div className="lg:col-span-8 glass-card rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex gap-2">
              {(['all', 'revenue', 'expenses'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  {tab === 'all' ? 'Tudo' : tab === 'revenue' ? 'Receitas' : 'Despesas'}
                </button>
              ))}
            </div>
            
            <div className="relative group w-full sm:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Buscar lançamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-medium">
              <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest text-left">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Lançamento</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="text-xs font-bold text-gray-400">Processando extratos...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <div className="p-4 bg-gray-50 rounded-full"><Search size={24} className="text-gray-300" /></div>
                         <p className="text-xs font-bold text-gray-400">Nenhum lançamento encontrado.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const transDate = new Date(t.date);
                    const isOverdue = transDate < new Date() && t.status !== 'Pago';
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
                            <div className={`p-2 rounded-lg ${t.type === 'receita' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {t.type === 'receita' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            </div>
                            <div>
                              <p className="text-gray-900 font-bold">
                                {t.description}
                                {t.students?.name && (
                                  <span className="text-primary font-black ml-2 px-2 py-0.5 bg-primary/5 rounded text-[10px]">
                                    {t.students.name.split(' ')[0]}
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{t.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-bold text-xs">{t.category}</td>
                        <td className="px-6 py-4 text-gray-900 font-bold text-xs">
                          {transDate.toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-black ${t.type === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
                            {t.type === 'receita' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-all"
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

        <FinanceInadimplencia data={DEFAULT_LIST} />
      </div>

      {/* BOTTOM TOOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORECAST */}
        <div className="glass-card p-10 rounded-[2.5rem] shadow-sm">
           <div className="flex items-center gap-3 mb-8">
              <Calendar className="text-primary" size={24} />
              <div>
                 <h4 className="text-lg font-bold font-display">Previsão 30 Dias</h4>
                 <p className="text-[10px] text-gray-400 font-bold uppercase">Entradas vs Saídas</p>
              </div>
           </div>
           <div className="space-y-6">
              {FORECAST_DATA.map((item: any, idx: number) => (
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
                Ticket médio aumento em <span className="font-black text-gray-900">{simulatorValue}%</span>?
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
        onSuccess={(updatedData) => {
          if (updatedData && updatedData.id?.toString().startsWith('sim-')) {
            setTransactions(prev => prev.map(t => t.id === updatedData.id ? { ...t, ...updatedData } : t));
          } else {
            fetchTransactions();
          }
        }}
      />

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
