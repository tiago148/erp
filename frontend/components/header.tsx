'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/global-search';
import { LogOut } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center gap-6 px-6">
      <span className="font-heading text-lg tracking-wide text-foreground shrink-0">OPRENDIN</span>
      <GlobalSearch />

      <div className="ml-auto flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <Button variant="ghost" size="icon" onClick={logout} title="Sair">
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}