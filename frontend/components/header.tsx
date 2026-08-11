'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/global-search';
import { LogOut } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <GlobalSearch />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>

        <Button variant="ghost" size="icon" onClick={logout} title="Sair">
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}