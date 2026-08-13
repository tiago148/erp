'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.push(user ? '/dashboard' : '/login');
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-background text-muted-foreground">
      Carregando...
    </div>
  );
}
