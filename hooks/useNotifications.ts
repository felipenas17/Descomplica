'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppNotification, MOCK_NOTIFICATIONS } from '@/lib/data';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    // Initial load
    setNotifications(MOCK_NOTIFICATIONS);

    // Simulate "Real-time" notification after 30 seconds
    const timer = setTimeout(() => {
      const newNotification: AppNotification = {
        id: 'n-live-' + Date.now(),
        type: 'class_upcoming',
        title: 'Aula em instantes',
        message: 'Lembrete: Sua próxima aula de Inglês começa em 10 minutos.',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high',
        category: 'teacher'
      };
      setNotifications(prev => [newNotification, ...prev]);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications([]);
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}
