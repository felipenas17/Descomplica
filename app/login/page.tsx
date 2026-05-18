'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/components/Login';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/');
      } else {
        setIsLoading(false);
      }
    }
    checkUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-app flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Login 
      onLogin={() => {
        router.push('/');
        router.refresh();
      }} 
    />
  );
}
