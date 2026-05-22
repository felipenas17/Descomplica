'use client';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  user_id: string;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    // Polling a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [userId]);

  const deleteNotification = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ archived: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification };
}
