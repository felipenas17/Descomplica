'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Calendar, 
  CreditCard, 
  UserPlus, 
  Trash2, 
  Clock, 
  UserCheck, 
  Users, 
  XCircle, 
  RefreshCw, 
  Star, 
  Info 
} from 'lucide-react';
import { NotificationType } from '@/lib/data';
import { useNotifications } from '@/hooks/useNotifications';

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'new_class':
    case 'class_scheduled':
      return <Calendar size={18} className="text-blue-500" />;
    case 'payment_due':
    case 'overdue_payment':
      return <CreditCard size={18} className="text-amber-500" />;
    case 'substitution_request':
      return <UserPlus size={18} className="text-purple-500" />;
    case 'new_enrollment':
    case 'student_added':
      return <UserCheck size={18} className="text-green-500" />;
    case 'teacher_idle':
    case 'feedback_pending':
    case 'feedback_required':
      return <RefreshCw size={18} className="text-orange-500" />;
    case 'class_limit':
      return <Users size={18} className="text-red-500" />;
    case 'class_cancelled':
      return <XCircle size={18} className="text-red-500" />;
    case 'schedule_change':
      return <RefreshCw size={18} className="text-blue-500" />;
    case 'class_upcoming':
      return <Clock size={18} className="text-red-500 animate-pulse" />;
    case 'reminder_grades':
      return <Star size={18} className="text-yellow-500" />;
    default:
      return <Info size={18} className="text-gray-500" />;
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

export function NotificationDropdown({ onViewAll }: { onViewAll?: () => void }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group"
        aria-label="Notificações"
      >
        <Bell size={20} className={isOpen ? 'text-primary' : 'text-gray-500 group-hover:text-primary transition-colors'} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-3 w-[450px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Notificações</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{unreadCount} não lidas</p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-5 flex gap-4 hover:bg-gray-50 transition-all group relative cursor-pointer ${!notification.read ? 'bg-primary/[0.02]' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        {!notification.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                        )}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          notification.priority === 'high' ? 'bg-red-50' : 
                          (notification.type === 'new_enrollment' || notification.type === 'student_added') ? 'bg-green-50' :
                          (notification.type === 'new_class' || notification.type === 'class_scheduled' || notification.type === 'schedule_change') ? 'bg-blue-50' :
                          (notification.type === 'payment_due' || notification.type === 'overdue_payment') ? 'bg-amber-50' :
                          'bg-purple-50'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm font-black truncate pr-4 ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </p>
                            <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap pt-0.5">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed mb-2 ${!notification.read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              notification.priority === 'high' ? 'bg-red-100 text-red-600' : 
                              notification.priority === 'medium' ? 'bg-blue-100 text-blue-600' : 
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-400">Nenhuma notificação</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      onViewAll?.();
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-primary transition-colors"
                  >
                    Ver todas as notificações
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
