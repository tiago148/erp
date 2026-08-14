import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  BookOpen,
  HardHat,
  Boxes,
  Package,
  ShoppingCart,
  Wallet,
  Wrench,
  ShieldCheck,
  BarChart3,
  Zap,
  Settings,
  UserCog,
  KanbanSquare,
  Calendar,
  UsersRound,
  Calculator,
  LineChart,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  { id: 'dashboard', label: 'Dashboard', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
  { id: 'cadastros', label: 'Clientes', items: [{ label: 'Clientes', href: '/dashboard/clientes', icon: Users }] },
  {
    id: 'obras',
    label: 'Obras',
    items: [
      { label: 'Projetos', href: '/dashboard/projetos', icon: Briefcase },
      { label: 'Orçamentos', href: '/dashboard/orcamentos', icon: FileText },
      { label: 'Diário de Obra', href: '/dashboard/diario', icon: BookOpen },
    ],
  },
  {
    id: 'organizacao',
    label: 'Organização',
    items: [
      { label: 'Tarefas', href: '/dashboard/tarefas', icon: KanbanSquare },
      { label: 'Calendário', href: '/dashboard/calendario', icon: Calendar },
    ],
  },
  {
    id: 'equipe',
    label: 'Equipe',
    items: [
      { label: 'Funcionários', href: '/dashboard/funcionarios', icon: UserCog },
      { label: 'Mão de Obra', href: '/dashboard/mao-de-obra', icon: HardHat },
      { label: 'Materiais', href: '/dashboard/materiais', icon: Boxes },
    ],
  },
  {
    id: 'suprimentos',
    label: 'Suprimentos',
    items: [
      { label: 'Estoque', href: '/dashboard/estoque', icon: Package },
      { label: 'Compras', href: '/dashboard/compras', icon: ShoppingCart },
    ],
  },
  { id: 'equipamentos', label: 'Equipamentos & Logística', items: [{ label: 'Equipamentos & Logística', href: '/dashboard/equipamentos', icon: Wrench }] },
  {
    id: 'financeiro',
    label: 'Financeiro',
    items: [
      { label: 'Financeiro', href: '/dashboard/financeiro', icon: Wallet },
      { label: 'Custos', href: '/dashboard/custos', icon: Calculator },
    ],
  },
  { id: 'seguranca', label: 'Segurança do Trabalho', items: [{ label: 'Segurança', href: '/dashboard/seguranca', icon: ShieldCheck }] },
  {
    id: 'relatorios',
    label: 'Relatórios',
    items: [
      { label: 'Relatórios', href: '/dashboard/relatorios', icon: BarChart3 },
      { label: 'Indicadores', href: '/dashboard/indicadores', icon: LineChart },
    ],
  },
  { id: 'automacoes', label: 'Automações', items: [{ label: 'Automações', href: '/dashboard/automacoes', icon: Zap }] },
  { id: 'usuarios', label: 'Usuários', items: [{ label: 'Usuários', href: '/dashboard/usuarios', icon: UsersRound }] },
  { id: 'config', label: 'Configurações', items: [{ label: 'Configurações', href: '/dashboard/config', icon: Settings }] },
];

export function isItemActive(href: string, pathname: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(href + '/');
}

export function findActiveGroup(pathname: string): NavGroup | undefined {
  return navGroups.find((group) => group.items.some((item) => isItemActive(item.href, pathname)));
}

export function getVisibleNavGroups(allowedModules?: string[]): NavGroup[] {
  if (!allowedModules || allowedModules.length === 0) return navGroups;
  return navGroups.filter((group) => allowedModules.includes(group.id));
}
