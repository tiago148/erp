'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Wallet, HandCoins, Package, FileText, Briefcase, KanbanSquare, ShieldAlert } from 'lucide-react';
import type { Budget, FinanceEntry, Project, StockItem, Task, Training } from '@/lib/api';

type Bucket = 'urgent' | 'today' | 'week';

interface ActionItem {
  key: string;
  bucket: Bucket;
  sortKey: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  text: string;
  meta: string;
  value?: string;
  href: string;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function daysBetween(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function ageDays(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

interface Props {
  financeEntries: FinanceEntry[];
  stockItems: StockItem[];
  budgets: Budget[];
  projects: Project[];
  tasks: Task[];
  trainings: Training[];
}

export function ActionCenter({ financeEntries, stockItems, budgets, projects, tasks, trainings }: Props) {
  const items: ActionItem[] = [];

  financeEntries
    .filter((e) => e.type === 'EXPENSE' && e.status === 'PENDING')
    .forEach((e) => {
      const d = daysBetween(e.dueDate);
      if (d > 7) return;
      items.push({
        key: `pagar-${e.id}`,
        bucket: d < 0 ? 'urgent' : d === 0 ? 'today' : 'week',
        sortKey: d,
        icon: Wallet,
        colorClass: 'text-destructive',
        bgClass: 'bg-destructive/15',
        text: d < 0 ? `${e.description} vencida há ${Math.abs(d)} dia(s)` : `Pagar ${e.description}`,
        meta: d === 0 ? 'Vence hoje' : d < 0 ? 'Financeiro' : `Vence em ${d} dia(s)`,
        value: fmt(e.amount),
        href: '/dashboard/financeiro',
      });
    });

  financeEntries
    .filter((e) => e.type === 'INCOME' && e.status === 'PENDING')
    .forEach((e) => {
      const d = daysBetween(e.dueDate);
      if (d > 7) return;
      items.push({
        key: `receber-${e.id}`,
        bucket: d < 0 ? 'urgent' : d === 0 ? 'today' : 'week',
        sortKey: d,
        icon: HandCoins,
        colorClass: 'text-success',
        bgClass: 'bg-success/15',
        text: d < 0 ? `${e.description} em atraso há ${Math.abs(d)} dia(s)` : `Receber ${e.description}`,
        meta: d === 0 ? 'Previsto para hoje' : d < 0 ? 'Financeiro' : `Previsto em ${d} dia(s)`,
        value: fmt(e.amount),
        href: '/dashboard/financeiro',
      });
    });

  stockItems
    .filter((s) => s.quantity <= s.minQuantity)
    .forEach((s) => {
      items.push({
        key: `estoque-${s.id}`,
        bucket: 'urgent',
        sortKey: s.quantity - s.minQuantity,
        icon: Package,
        colorClass: 'text-destructive',
        bgClass: 'bg-destructive/15',
        text: `${s.material.name} abaixo do mínimo`,
        meta: 'Estoque',
        value: `${s.quantity} / ${s.minQuantity} ${s.material.unit}`,
        href: '/dashboard/estoque',
      });
    });

  budgets
    .filter((b) => b.status === 'DRAFT' || b.status === 'SENT' || b.status === 'NEGOTIATING')
    .forEach((b) => {
      const age = ageDays(b.createdAt);
      if (age < 3) return;
      items.push({
        key: `orcamento-${b.id}`,
        bucket: age >= 7 ? 'urgent' : 'week',
        sortKey: -age,
        icon: FileText,
        colorClass: 'text-warning',
        bgClass: 'bg-warning/15',
        text: `Orçamento #${b.number} aguardando retorno há ${age} dia(s)`,
        meta: b.client.name,
        value: fmt(b.totals.total),
        href: '/dashboard/orcamentos',
      });
    });

  projects
    .filter((p) => p.endDate && (p.status === 'IN_PROGRESS' || p.status === 'PLANNING'))
    .forEach((p) => {
      const d = daysBetween(p.endDate!);
      if (d > 7) return;
      items.push({
        key: `projeto-${p.id}`,
        bucket: d < 0 ? 'urgent' : d === 0 ? 'today' : 'week',
        sortKey: d,
        icon: Briefcase,
        colorClass: d < 0 ? 'text-destructive' : 'text-primary',
        bgClass: d < 0 ? 'bg-destructive/15' : 'bg-primary/15',
        text: d < 0 ? `${p.name} com prazo estourado há ${Math.abs(d)} dia(s)` : `Prazo de ${p.name}`,
        meta: p.client.name,
        href: '/dashboard/projetos',
      });
    });

  tasks
    .filter((t) => t.dueDate && t.status !== 'DONE')
    .forEach((t) => {
      const d = daysBetween(t.dueDate!);
      if (d > 7) return;
      items.push({
        key: `tarefa-${t.id}`,
        bucket: d < 0 ? 'urgent' : d === 0 ? 'today' : 'week',
        sortKey: d,
        icon: KanbanSquare,
        colorClass: 'text-info',
        bgClass: 'bg-info/15',
        text: d < 0 ? `${t.title} atrasada há ${Math.abs(d)} dia(s)` : t.title,
        meta: d === 0 ? 'Hoje' : `Em ${d} dia(s)`,
        href: '/dashboard/tarefas',
      });
    });

  trainings
    .filter((t) => t.expiresAt)
    .forEach((t) => {
      const d = daysBetween(t.expiresAt!);
      if (d > 30) return;
      items.push({
        key: `treinamento-${t.id}`,
        bucket: d < 0 ? 'urgent' : 'week',
        sortKey: d,
        icon: ShieldAlert,
        colorClass: 'text-warning',
        bgClass: 'bg-warning/15',
        text: `${t.nrType} — ${t.employee.name}`,
        meta: d < 0 ? `Vencido há ${Math.abs(d)} dia(s)` : `Vence em ${d} dia(s)`,
        href: '/dashboard/seguranca',
      });
    });

  const urgent = items.filter((i) => i.bucket === 'urgent').sort((a, b) => a.sortKey - b.sortKey);
  const today = items.filter((i) => i.bucket === 'today').sort((a, b) => a.sortKey - b.sortKey);
  const week = items.filter((i) => i.bucket === 'week').sort((a, b) => a.sortKey - b.sortKey);

  const total = urgent.length + today.length + week.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl tracking-wide flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
          Central de Ações
        </h2>
        <span className="text-xs text-muted-foreground">{total} item(ns)</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <ActionColumn title="Urgente" colorClass="text-destructive" borderClass="border-destructive/30" items={urgent} emptyText="Nada vencido ou estourado." />
        <ActionColumn title="Hoje" colorClass="text-primary" borderClass="border-primary/30" items={today} emptyText="Nada marcado para hoje." />
        <ActionColumn title="Esta semana" colorClass="text-info" borderClass="border-info/30" items={week} emptyText="Semana livre de compromissos." />
      </div>
    </div>
  );
}

function ActionColumn({
  title,
  colorClass,
  borderClass,
  items,
  emptyText,
}: {
  title: string;
  colorClass: string;
  borderClass: string;
  items: ActionItem[];
  emptyText: string;
}) {
  return (
    <div className={`rounded-xl border ${borderClass} bg-card overflow-hidden flex flex-col`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>{title}</span>
        <span className={`font-mono text-xs font-bold ${colorClass}`}>{items.length}</span>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">{emptyText}</p>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-start gap-2.5 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${item.bgClass} ${item.colorClass}`}>
                  <Icon size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-foreground leading-snug">{item.text}</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">{item.meta}</span>
                </span>
                {item.value && <span className="shrink-0 font-mono text-[11px] font-medium text-muted-foreground">{item.value}</span>}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
