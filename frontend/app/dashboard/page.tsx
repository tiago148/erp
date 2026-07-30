'use client';

import { useAuth } from '@/context/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Bem-vindo, {user?.name}!</h1>
        <p className="text-gray-600">Email: {user?.email}</p>
        <p className="text-gray-600">Role: {user?.role}</p>
        <Button onClick={logout} className="mt-4">
          Sair
        </Button>
      </div>
    </ProtectedRoute>
  );
}
