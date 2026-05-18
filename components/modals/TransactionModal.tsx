'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Calendar, DollarSign, Wallet, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'revenue' | 'expense';
  onSuccess: (updatedData?: any) => void;
  transaction?: any;
}

export default function TransactionModal({ isOpen, onClose, type: initialType = 'revenue', onSuccess, transaction }: TransactionModalProps) {
  const [type, setType] = useState<'revenue' | 'expense'>(transaction?.type || initialType);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    description: transaction?.description || '',
    category: transaction?.category || '',
    value: transaction?.value?.toString() || '',
    due_date: transaction?.due_date || new Date().toISOString().split('T')[0],
    payment_method: transaction?.payment_method || 'Pix',
    cost_type: (transaction?.cost_type || 'Fixo') as 'Fixo' | 'Variável',
    is_recurring: transaction?.is_recurring || false,
    recurrence_period: (transaction?.recurrence_period || 'Mensal') as 'Semanal' | 'Mensal' | 'Anual',
    start_date: transaction?.start_date || new Date().toISOString().split('T')[0],
    end_date: transaction?.end_date || '',
    student_id: transaction?.student_id || '',
  });

  // Load students for selection
  React.useEffect(() => {
    async function loadStudents() {
      try {
        const { data } = await supabase.from('students').select('id, name').eq('status', 'Ativo');
        setStudents(data || []);
      } catch (e) {
        console.error('Error loading students for transaction modal:', e);
      }
    }
    if (isOpen) loadStudents();
  }, [isOpen]);

  // Re-sync form data when transaction changes
  React.useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setFormData({
        description: transaction.description || '',
        category: transaction.category || '',
        value: transaction.value?.toString() || '',
        due_date: transaction.due_date || new Date().toISOString().split('T')[0],
        payment_method: transaction.payment_method || 'Pix',
        cost_type: (transaction.cost_type || 'Fixo') as 'Fixo' | 'Variável',
        is_recurring: transaction.is_recurring || false,
        recurrence_period: (transaction.recurrence_period || 'Mensal') as 'Semanal' | 'Mensal' | 'Anual',
        start_date: transaction.start_date || new Date().toISOString().split('T')[0],
        end_date: transaction.end_date || '',
        student_id: transaction.student_id || '',
      });
    } else {
      setType(initialType);
      setFormData({
        description: '',
        category: '',
        value: '',
        due_date: new Date().toISOString().split('T')[0],
        payment_method: 'Pix',
        cost_type: 'Fixo',
        is_recurring: false,
        recurrence_period: 'Mensal',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        student_id: '',
      });
    }
  }, [transaction, initialType, isOpen]);

  const categories = type === 'revenue' 
    ? ['Mensalidade', 'Aula Particular', 'Evento', 'Venda de Material', 'Outros']
    : ['Professor', 'Marketing', 'Aluguel', 'Plataforma/SaaS', 'Operacional', 'Impostos', 'Outros'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const transactionData: any = {
        type: type === 'revenue' ? 'receita' : 'despesa',
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.value),
        date: formData.due_date,
        student_id: formData.student_id || null,
        created_by: (await supabase.auth.getUser()).data.user?.id || null
      };

      let error;
      if (transaction?.id?.toString().startsWith('sim-')) {
        // Simulation mode - we pass back the data to be updated locally
        console.log('[TransactionModal] Simulação: Lançamento atualizado localmente.', transactionData);
        alert('Modo Demo: Lançamento atualizado localmente!');
        onSuccess({ ...transactionData, id: transaction.id, value: transactionData.amount });
        onClose();
        return;
      }

      if (transaction?.id) {
        // Edit mode
        const { error: updateError } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction.id);
        error = updateError;
      } else {
        // Create mode
        const { error: insertError } = await supabase.from('transactions').insert([transactionData]);
        error = insertError;
      }

      if (error) throw error;

      alert(transaction?.id ? 'Lançamento atualizado com sucesso!' : 'Lançamento criado com sucesso!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Detailed Save Error:', err);
      
      let errorMessage = 'Ocorreu um erro ao salvar.';
      if (err.message && err.message.includes('PGRST125')) {
        errorMessage = 'Erro de Sincronização Supabase (PGRST125): A tabela existe, mas o API ainda não a reconheceu. Execute "GRANT ALL ON TABLE public.transactions TO anon;" no editor SQL do Supabase.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert('Erro ao salvar lançamento: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className={`p-8 flex justify-between items-center ${type === 'revenue' ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${type === 'revenue' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {transaction?.id ? <Clock size={24} /> : (type === 'revenue' ? <Plus size={24} /> : <Minus size={24} />)}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {transaction?.id ? 'Editar' : 'Nova'} {type === 'revenue' ? 'Receita' : 'Despesa'}
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cadastro Financeiro</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-xl transition-all">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Type Toggle */}
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('revenue')}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${type === 'revenue' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                RECEITA
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                DESPESA
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    required
                    type="text"
                    placeholder="Ex: Mensalidade João"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  <option value="">Selecionar...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vencimento</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    required
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              {type === 'revenue' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aluno (Opcional)</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                  >
                    <option value="">Nenhum aluno selecionado</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Forma de Pagamento</label>
                <select
                  required
                  value={formData.payment_method}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  {['Pix', 'Cartão', 'Dinheiro', 'Boleto'].map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {type === 'expense' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Custo</label>
                  <select
                    required
                    value={formData.cost_type}
                    onChange={(e) => setFormData({...formData, cost_type: e.target.value as any})}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                  >
                    <option value="Fixo">Fixo</option>
                    <option value="Variável">Variável</option>
                  </select>
                </div>
              )}
            </div>

            {/* Recurrence */}
            <div className="p-6 bg-primary/5 rounded-[2rem] space-y-4 border border-primary/5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-10 h-6 rounded-full transition-all relative ${formData.is_recurring ? 'bg-primary' : 'bg-gray-200'}`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                  />
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.is_recurring ? 'left-5' : 'left-1'}`}></div>
                </div>
                <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Pagamento Recorrente</span>
              </label>

              <AnimatePresence>
                {formData.is_recurring && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden pt-2"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase ml-1">Frequência</p>
                        <select
                          value={formData.recurrence_period}
                          onChange={(e) => setFormData({...formData, recurrence_period: e.target.value as any})}
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          <option value="Semanal">Semanal</option>
                          <option value="Mensal">Mensal</option>
                          <option value="Anual">Anual</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase ml-1">Fim (Opcional)</p>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              disabled={loading}
              className={`w-full py-5 rounded-2xl text-sm font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:scale-[1.02] active:scale-95 shadow-primary/20'}`}
            >
              {loading ? (
                <>
                  <Clock className="animate-spin" size={20} />
                  PROCESSANDO...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  SALVAR LANÇAMENTO
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
