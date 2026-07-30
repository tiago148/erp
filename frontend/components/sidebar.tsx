'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Wallet,
  BarChart3,
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { label: 'Orçamentos', href: '/dashboard/orcamentos', icon: FileText },
  { label: 'Estoque', href: '/dashboard/estoque', icon: Package },
  { label: 'Financeiro', href: '/dashboard/financeiro', icon: Wallet },
  { label: 'Relatórios', href: '/dashboard/relatorios', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r bg-white flex flex-col">
      <div className="h-16 flex items-center px-6 border-b">
        <span className="font-bold text-lg">ERP Inox</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}