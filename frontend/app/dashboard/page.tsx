'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Project, Budget, StockItem, Training, Task, CalendarEvent } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Package, Wallet, AlertTriangle, Briefcase, KanbanSquare } from 'lucide-react';
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
    ]).then(([p, b, s, t, tk, e]) => {
      setProjects(p);
      setBudgets(b);
      setStockItems(s);
      setTrainings(t);
      setTasks(tk);
      setEvents(e);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return <p className="text-gray-500">Carregando...</p>;
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
        <p className="text-gray-500">Aqui está um resumo do seu sistema.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Projetos Ativos</CardTitle>
            <Briefcase size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeProjects.length}</p>
            <p className="text-xs text-gray-400">de {projects.length} projetos totais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Orçamentos em Aberto</CardTitle>
            <FileText size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(totalPipelineValue)}</p>
            <p className="text-xs text-gray-400">{pendingBudgets.length} orçamento(s) pendente(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tarefas Urgentes</CardTitle>
            <KanbanSquare size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{urgentTasks.length}</p>
            <p className="text-xs text-gray-400">alta ou urgente, não concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Alertas Ativos</CardTitle>
            <AlertTriangle size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAlerts}</p>
            <p className="text-xs text-gray-400">estoque, treinamentos, tarefas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alertas consolidados */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" />Alertas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {totalAlerts === 0 ? (
              <p className="text-sm text-gray-400">Nenhum alerta no momento.</p>
            ) : (
              <>
                {lowStock.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span className="flex items-center gap-2"><Package size={14} className="text-red-500" />{item.material.name}</span>
                    <span className="text-red-600 font-medium">{item.quantity} / {item.minQuantity} {item.material.unit}</span>
                  </div>
                ))}
                {trainingAlerts.slice(0, 3).map((t) => {
                  const days = daysBetween(t.expiresAt!);
                  return (
                    <div key={t.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" />{t.employee.name} — {t.nrType}</span>
                      <span className={days < 0 ? 'text-red-600 font-medium' : 'text-amber-600 font-medium'}>
                        {days < 0 ? `Vencido há ${Math.abs(days)}d` : `${days}d restantes`}
                      </span>
                    </div>
                  );
                })}
                {urgentTasks.slice(0, 3).map((t) => (
                  <div key={t.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span className="flex items-center gap-2"><KanbanSquare size={14} className="text-orange-500" />{t.title}</span>
                    <span className="text-orange-600 font-medium">{t.priority === 'URGENT' ? 'Urgente' : 'Alta'}</span>
                  </div>
                ))}
                <Link href="/dashboard/automacoes" className="text-xs text-blue-600 hover:underline block pt-1">Ver todos os alertas →</Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Próximos eventos */}
        <Card>
          <CardHeader><CardTitle className="text-base">Próximos Eventos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum evento agendado.</p>
            ) : (
              <>
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span>{e.title}</span>
                    <span className="text-gray-500">{formatDate(e.date)}</span>
                  </div>
                ))}
                <Link href="/dashboard/calendario" className="text-xs text-blue-600 hover:underline block pt-1">Ver calendário completo →</Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projetos recentes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Projetos Recentes</CardTitle></CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum projeto cadastrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {recentProjects.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{p.number} - {p.name}</p>
                    <p className="text-xs text-gray-500">{p.client.name}</p>
                  </div>
                  <span className="text-gray-500">{fmt(p.budgetAmount)}</span>
                </div>
              ))}
              <Link href="/dashboard/projetos" className="text-xs text-blue-600 hover:underline block pt-1">Ver todos os projetos →</Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}