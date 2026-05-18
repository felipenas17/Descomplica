'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, DollarSign, User, FileText, Bell, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment?: any; // Para edição futuramente
}

export default function AppointmentModal({ isOpen, onClose, onSuccess, appointment }: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'reuniao',
    date: new Date().toISOString().split('T')[0],
    time_start: '',
    time_end: '',
    amount: '',
    responsible: '',
    description: '',
    reminder: 'none'
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        title: appointment.title || '',
        type: appointment.type || 'reuniao',
        date: appointment.date || '',
        time_start: appointment.time_start || '',
        time_end: appointment.time_end || '',
        amount: appointment.amount?.toString() || '',
        responsible: appointment.responsible || '',
        description: appointment.description || '',
        reminder: appointment.reminder || 'none'
      });
    }
  }, [appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        ...formData,
        amount: formData.type === 'pagamento' ? parseFloat(formData.amount) || null : null,
        created_by: user?.id
      };

      let error;
      if (appointment?.id) {
        const { error: updateError } = await supabase
          .from('appointments')
          .update(payload)
          .eq('id', appointment.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('appointments')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(appointment?.id ? 'Compromisso atualizado!' : 'Compromisso agendado com sucesso!');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '',
        type: 'reuniao',
        date: new Date().toISOString().split('T')[0],
        time_start: '',
        time_end: '',
        amount: '',
        responsible: '',
        description: '',
        reminder: 'none'
      });
    } catch (err: any) {
      console.error('Erro ao salvar compromisso:', err);
      toast.error('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo Compromisso</h2>
            <p className="text-sm text-gray-500">Agende reuniões, pagamentos ou tarefas</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400"><FileText size={18} /></span>
              <input 
                type="text"
                required
                placeholder="Ex: Reunião com fornecedores"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipo *</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="reuniao">🔵 Reunião</option>
                <option value="pagamento">🟢 Pagamento</option>
                <option value="tarefa">🟡 Tarefa</option>
                <option value="urgente">🔴 Urgente</option>
                <option value="outro">🟣 Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Data *</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Calendar size={18} /></span>
                <input 
                  type="date"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Hora Início</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Clock size={18} /></span>
                <input 
                  type="time"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.time_start}
                  onChange={(e) => setFormData({...formData, time_start: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Hora Fim</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Clock size={18} /></span>
                <input 
                  type="time"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.time_end}
                  onChange={(e) => setFormData({...formData, time_end: e.target.value})}
                />
              </div>
            </div>
          </div>

          {formData.type === 'pagamento' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
              <label className="block text-sm font-bold text-gray-700 mb-1">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><DollarSign size={18} /></span>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Responsável</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><User size={18} /></span>
                <input 
                  type="text"
                  placeholder="Nome do responsável"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.responsible}
                  onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Lembrete</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Bell size={18} /></span>
                <select 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.reminder}
                  onChange={(e) => setFormData({...formData, reminder: e.target.value})}
                >
                  <option value="none">Sem lembrete</option>
                  <option value="1h">1h antes</option>
                  <option value="1d">1 dia antes</option>
                  <option value="1w">1 semana antes</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
            <textarea 
              rows={3}
              placeholder="Detalhes adicionais..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </form>

        <div className="p-6 bg-gray-50 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all"
          >
            Cancelar
          </button>
          <button 
            type="button"
            disabled={loading || !formData.title || !formData.date}
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Check size={20} />}
            Salvar Compromisso
          </button>
        </div>
      </motion.div>
    </div>
  );
}
