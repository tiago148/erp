'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  BookOpen,
  HardHat,
  Boxes,
  Package,
  Wallet,
  Wrench,
  ShieldCheck,
  BarChart3,
  Zap,
  Settings,
} from 'lucide-react';

const menuGroups = [
  { items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
  { label: 'Cadastros', items: [{ label: 'Clientes', href: '/dashboard/clientes', icon: Users }] },
  {
    label: 'Obras',
    items: [
      { label: 'Projetos', href: '/dashboard/projetos', icon: Briefcase },
      { label: 'Orçamentos', href: '/dashboard/orcamentos', icon: FileText },
      { label: 'Diário de Obra', href: '/dashboard/diario', icon: BookOpen },
    ],
  },
  {
    label: 'Equipe',
    items: [
      { label: 'Mão de Obra', href: '/dashboard/mao-de-obra', icon: HardHat },
      { label: 'Materiais', href: '/dashboard/materiais', icon: Boxes },
    ],
  },
  {
    label: 'Suprimentos',
    items: [{ label: 'Estoque', href: '/dashboard/estoque', icon: Package }],
  },
  {
    label: 'Equipamentos & Logística',
    items: [{ label: 'Equipamentos & Logística', href: '/dashboard/equipamentos', icon: Wrench }],
  },
  { label: 'Financeiro', items: [{ label: 'Financeiro', href: '/dashboard/financeiro', icon: Wallet }] },
  {
    items: [
      { label: 'Segurança', href: '/dashboard/seguranca', icon: ShieldCheck },
      { label: 'Relatórios', href: '/dashboard/relatorios', icon: BarChart3 },
      { label: 'Automações', href: '/dashboard/automacoes', icon: Zap },
      { label: 'Configurações', href: '/dashboard/config', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 border-r bg-white flex flex-col overflow-y-auto">
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <span className="font-bold text-lg">ERP Inox</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-4">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {group.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{group.label}</p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}>
                    <Icon size={18} />{item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}