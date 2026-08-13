'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Project, Budget, StockItem, Training, Task, CalendarEvent, FinanceEntry } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionCenter } from '@/components/action-center';
import { FileText, AlertTriangle, Briefcase, KanbanSquare } from 'lucide-react';
import Link from 'next/link';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function daysBetween(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.listProjects(token),
      api.listBudgets(token),
      api.listStockItems(token),
      api.listTrainings(token),
      api.listTasks(token),
      api.listCalendarEvents(token),
      api.listFinanceEntries(token),
    ]).then(([p, b, s, t, tk, e, f]) => {
      setProjects(p);
      setBudgets(b);
      setStockItems(s);
      setTrainings(t);
      setTasks(tk);
      setEvents(e);
      setFinanceEntries(f);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING');
  const pendingBudgets = budgets.filter((b) => b.status === 'DRAFT' || b.status === 'SENT' || b.status === 'NEGOTIATING');
  const lowStock = stockItems.filter((s) => s.quantity <= s.minQuantity);
  const trainingAlerts = trainings.filter((t) => t.expiresAt && daysBetween(t.expiresAt) <= 30);
  const urgentTasks = tasks.filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'DONE');
  const totalPipelineValue = pendingBudgets.reduce((s, b) => s + b.totals.total, 0);

  const upcomingEvents = events
    .filter((e) => new Date(e.date).getTime() >= new Date().setHours(0, 0, 0, 0))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const totalAlerts = lowStock.length + trainingAlerts.length + urgentTasks.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Olá, {user?.name}</h1>
        <p className="text-muted-foreground">Aqui está um resumo do seu sistema.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projetos Ativos</CardTitle>
            <Briefcase size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeProjects.length}</p>
            <p className="text-xs text-muted-foreground">de {projects.length} projetos totais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orçamentos em Aberto</CardTitle>
            <FileText size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(totalPipelineValue)}</p>
            <p className="text-xs text-muted-foreground">{pendingBudgets.length} orçamento(s) pendente(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tarefas Urgentes</CardTitle>
            <KanbanSquare size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{urgentTasks.length}</p>
            <p className="text-xs text-muted-foreground">alta ou urgente, não concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertas Ativos</CardTitle>
            <AlertTriangle size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAlerts}</p>
            <p className="text-xs text-muted-foreground">estoque, treinamentos, tarefas</p>
          </CardContent>
        </Card>
      </div>

      <ActionCenter
        financeEntries={financeEntries}
        stockItems={stockItems}
        budgets={budgets}
        projects={projects}
        tasks={tasks}
        trainings={trainings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Próximos eventos */}
        <Card>
          <CardHeader><CardTitle className="text-base">Próximos Eventos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento agendado.</p>
            ) : (
              <>
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span>{e.title}</span>
                    <span className="text-muted-foreground">{formatDate(e.date)}</span>
                  </div>
                ))}
                <Link href="/dashboard/calendario" className="text-xs text-info hover:underline block pt-1">Ver calendário completo →</Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Projetos recentes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Projetos Recentes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto cadastrado ainda.</p>
            ) : (
              <>
                {recentProjects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{p.number} - {p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.client.name}</p>
                    </div>
                    <span className="text-muted-foreground font-mono">{fmt(p.budgetAmount)}</span>
                  </div>
                ))}
                <Link href="/dashboard/projetos" className="text-xs text-info hover:underline block pt-1">Ver todos os projetos →</Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}