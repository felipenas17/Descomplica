'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function usePushNotifications(userId?: string) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
    }
  }, []);

  const subscribe = async () => {
    if (!supported || !userId) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        subscription: sub.toJSON(),
      }, { onConflict: 'user_id' });
      setSubscribed(true);
    } catch (e) {
      console.error('Push subscribe error:', e);
    }
  };

  return { supported, subscribed, subscribe };
}

export async function sendPushToUser(userId: string, title: string, body: string, url?: string) {
  try {
    const { data } = await supabase.from('push_subscriptions').select('subscription').eq('user_id', userId).single();
    if (!data) return;
    await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: data.subscription, title, body, url }),
    });
  } catch (e) {
    console.error('Send push error:', e);
  }
}
