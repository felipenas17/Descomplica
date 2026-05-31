'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
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
  const channelRef = useRef<any>(null);

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
    if (!userId) return;

    fetchNotifications();

    try {
      const channel = supabase
        .channel('notif_' + userId)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: 'user_id=eq.' + userId,
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      channelRef.current = channel;
    } catch (e) {
      // fallback polling se realtime falhar
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, fetchNotifications]);

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
