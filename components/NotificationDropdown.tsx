'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Calendar, CreditCard, UserPlus, Check, Trash2, Clock } from 'lucide-react';
import { MOCK_NOTIFICATIONS, AppNotification, NotificationType } from '@/lib/data';

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'new_class':
      return <Calendar size={18} className="text-blue-500" />;
    case 'payment_due':
      return <CreditCard size={18} className="text-amber-500" />;
    case 'substitution_request':
      return <UserPlus size={18} className="text-purple-500" />;
    default:
      return <Bell size={18} className="text-gray-500" />;
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

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="font-bold text-gray-900">Notificações</h3>
                  <p className="text-xs text-gray-500">Você tem {unreadCount} mensagens não lidas</p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary-dark transition-colors"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${!notification.read ? 'bg-primary/5' : ''}`}
                      >
                        {!notification.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                        )}
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            notification.type === 'new_class' ? 'bg-blue-50' : 
                            notification.type === 'payment_due' ? 'bg-amber-50' : 
                            'bg-purple-50'
                          }`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className={`text-sm font-bold truncate ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notification.title}
                              </h4>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                                <Clock size={10} />
                                {getTimeAgo(notification.timestamp)}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 leading-relaxed ${!notification.read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                              {notification.message}
                            </p>
                            <div className="mt-3 flex justify-between items-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                                notification.priority === 'high' ? 'bg-red-100 text-red-600' : 
                                notification.priority === 'medium' ? 'bg-blue-100 text-blue-600' : 
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {notification.priority === 'high' ? 'Urgente' : 
                                 notification.priority === 'medium' ? 'Importante' : 
                                 'Normal'}
                              </span>
                              
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                    className="p-1 hover:bg-primary/10 text-primary rounded-md transition-colors"
                                    title="Marcar como lida"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => deleteNotification(notification.id, e)}
                                  className="p-1 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-4 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell size={24} className="text-gray-300" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 border-none">Sem notificações</h4>
                    <p className="text-xs text-gray-500 mt-1">Você está em dia com tudo!</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <button className="text-xs font-bold text-gray-500 hover:text-primary transition-colors">
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
