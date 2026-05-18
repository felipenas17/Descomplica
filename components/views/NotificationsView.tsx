'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Search, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  Calendar, 
  CreditCard, 
  UserPlus, 
  UserCheck, 
  RefreshCw, 
  Users, 
  XCircle, 
  Star, 
  Info,
  Check
} from 'lucide-react';
import { NotificationType } from '@/lib/data';
import { useNotifications } from '@/hooks/useNotifications';

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'new_class':
    case 'class_scheduled':
      return <Calendar size={24} className="text-blue-500" />;
    case 'payment_due':
    case 'overdue_payment':
      return <CreditCard size={24} className="text-amber-500" />;
    case 'substitution_request':
      return <UserPlus size={24} className="text-purple-500" />;
    case 'new_enrollment':
    case 'student_added':
      return <UserCheck size={24} className="text-green-500" />;
    case 'teacher_idle':
    case 'feedback_pending':
    case 'feedback_required':
      return <RefreshCw size={24} className="text-orange-500" />;
    case 'class_limit':
      return <Users size={24} className="text-red-500" />;
    case 'class_cancelled':
      return <XCircle size={24} className="text-red-500" />;
    case 'schedule_change':
      return <RefreshCw size={24} className="text-blue-500" />;
    case 'class_upcoming':
      return <Clock size={24} className="text-red-500 animate-pulse" />;
    case 'reminder_grades':
      return <Star size={24} className="text-yellow-500" />;
    default:
      return <Info size={24} className="text-gray-500" />;
  }
};

const getTimeAgo = (timestamp: string) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return 'Agora';
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d atrás`;
};

export default function NotificationsView() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'admin' | 'teacher'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTab = 
        activeTab === 'all' ? true :
        activeTab === 'unread' ? !n.read :
        activeTab === 'admin' ? n.category === 'admin' :
        activeTab === 'teacher' ? n.category === 'teacher' : true;

      return matchesSearch && matchesTab;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, activeTab, searchTerm]);

  return (
    <div className="space-y-8 pb-12 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary relative">
            <Bell size={28} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">Central de Notificações</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Fique por dentro de tudo na Sintegra</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-6 py-3 text-primary bg-primary/5 hover:bg-primary/10 rounded-2xl text-[10px] font-black uppercase transition-all"
            >
              <CheckCircle2 size={16} />
              Marcar lidas
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl self-start md:self-auto">
          {(['all', 'unread', 'admin', 'teacher'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'all' ? 'Todas' : 
               tab === 'unread' ? 'Não Lidas' : 
               tab === 'admin' ? 'Administrativo' : 
               'Pedagógico'}
            </button>
          ))}
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar notificações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-[2rem] border transition-all group relative overflow-hidden ${
                  !n.read 
                    ? 'bg-white border-primary/20 shadow-md shadow-primary/5 ring-1 ring-primary/5' 
                    : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-sm'
                }`}
              >
                {!n.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                )}
                
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                    n.priority === 'high' ? 'bg-red-50' : 
                    n.priority === 'medium' ? 'bg-blue-50' : 
                    'bg-gray-50'
                  }`}>
                    {getIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className={`text-lg font-black transition-colors ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          n.priority === 'high' ? 'bg-red-100 text-red-600' : 
                          n.priority === 'medium' ? 'bg-blue-100 text-blue-600' : 
                          'bg-gray-200 text-gray-500'
                        }`}>
                          {n.priority === 'high' ? 'Urgente' : n.priority === 'medium' ? 'Importante' : 'Informativa'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          n.category === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {n.category === 'admin' ? 'Administrativo' : 'Professor'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                        <Clock size={12} />
                        {getTimeAgo(n.timestamp)}
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed max-w-3xl ${!n.read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">
                      ID: {n.id.toUpperCase()} • {new Date(n.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 justify-end sm:justify-start opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all"
                        title="Marcar como lida"
                      >
                        <Check size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(n.id)}
                      className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                <Bell size={40} />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Tudo limpo por aqui!</h2>
              <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto">
                Não encontramos nenhuma notificação com os filtros selecionados.
              </p>
              <button 
                onClick={() => { setActiveTab('all'); }}
                className="mt-8 px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase transition-all"
              >
                Limpar filtros
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
