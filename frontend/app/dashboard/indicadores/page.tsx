'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Budget, FinanceEntry, Client } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AbcList } from '@/components/abc-list';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type Period = 'mes' | '3m' | 'ano' | 'tudo';
const periodLabels: Record<Period, string> = { mes: 'Este mês', '3m': 'Últimos 3 meses', ano: 'Este ano', tudo: 'Todo o período' };

function periodStart(period: Period) {
  const now = new Date();
  if (period === 'mes') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === '3m') return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (period === 'ano') return new Date(now.getFullYear(), 0, 1);
  return new Date(2000, 0, 1);
}

function Kpi({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent>
        <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function IndicadoresPage() {
  const { token } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('ano');

  useEffect(() => {
    if (!token) return;
    Promise.all([api.listBudgets(token), api.listFinanceEntries(token), api.listClients(token)]).then(([b, f, c]) => {
      setBudgets(b);
      setEntries(f);
      setClients(c);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  const start = periodStart(period);
  const inPeriod = (dateStr: string) => new Date(dateStr) >= start;

  const budgetsInPeriod = budgets.filter((b) => inPeriod(b.createdAt));
  const approved = budgetsInPeriod.filter((b) => b.status === 'APPROVED');
  const rejected = budgetsInPeriod.filter((b) => b.status === 'REJECTED');
  const decided = approved.length + rejected.length;
  const conversionRate = decided ? (approved.length / decided) * 100 : 0;
  const ticketMedio = approved.length ? approved.reduce((s, b) => s + b.totals.total, 0) / approved.length : 0;
  const pipeline = budgetsInPeriod.filter((b) => b.status === 'DRAFT' || b.status === 'SENT' || b.status === 'NEGOTIATING');
  const pipelineValue = pipeline.reduce((s, b) => s + b.totals.total, 0);
  const lostValue = rejected.reduce((s, b) => s + b.totals.total, 0);

  const entriesInPeriod = entries.filter((e) => inPeriod(e.dueDate));
  const receita = entriesInPeriod.filter((e) => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0);
  const despesa = entriesInPeriod.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);
  const resultado = receita - despesa;

  const receivedIncome = entries.filter((e) => e.type === 'INCOME' && e.status === 'PAID' && e.paidAt);
  const pmr = receivedIncome.length
    ? receivedIncome.reduce((s, e) => s + Math.max(0, Math.round((new Date(e.paidAt!).getTime() - new Date(e.dueDate).getTime()) / 86400000)), 0) / receivedIncome.length
    : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const pendingIncome = entries.filter((e) => e.type === 'INCOME' && e.status === 'PENDING');
  const overdueIncome = pendingIncome.filter((e) => e.dueDate.slice(0, 10) < todayStr);
  const totalPendingIncome = pendingIncome.reduce((s, e) => s + e.amount, 0);
  const overdueValue = overdueIncome.reduce((s, e) => s + e.amount, 0);
  const inadimplenciaPct = totalPendingIncome > 0 ? (overdueValue / totalPendingIncome) * 100 : 0;

  const clientTotals = clients
    .map((c) => ({ label: c.name, value: budgets.filter((b) => b.clientId === c.id && b.status === 'APPROVED').reduce((s, b) => s + b.totals.total, 0) }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const categoryTotals = new Map<string, number>();
  entries.filter((e) => e.type === 'EXPENSE').forEach((e) => {
    const key = e.category?.name || 'Sem categoria';
    categoryTotals.set(key, (categoryTotals.get(key) || 0) + e.amount);
  });
  const expenseByCategory = Array.from(categoryTotals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel de Indicadores</h1>
          <p className="text-muted-foreground">Indicadores comerciais e financeiros consolidados.</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-48"><SelectValue>{periodLabels[period]}</SelectValue></SelectTrigger>
          <SelectContent>
            {(Object.keys(periodLabels) as Period[]).map((p) => <SelectItem key={p} value={p}>{periodLabels[p]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h2 className="font-heading text-lg tracking-wide mb-3">Comercial</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Taxa de Conversão" value={`${conversionRate.toFixed(1)}%`} color={conversionRate >= 40 ? 'text-success' : conversionRate >= 25 ? 'text-warning' : 'text-destructive'} sub={`${approved.length} de ${decided} orçamentos decididos`} />
          <Kpi label="Ticket Médio Aprovado" value={fmt(ticketMedio)} color="text-primary" />
          <Kpi label="Pipeline em Aberto" value={fmt(pipelineValue)} color="text-info" sub={`${pipeline.length} orçamento(s) em jogo`} />
          <Kpi label="Valor Perdido" value={fmt(lostValue)} color="text-destructive" sub={`${rejected.length} reprovado(s)`} />
        </div>
      </div>

      <div>
        <h2 className="font-heading text-lg tracking-wide mb-3">Financeiro</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Receita no Período" value={fmt(receita)} color="text-success" sub={`${entriesInPeriod.filter((e) => e.type === 'INCOME').length} lançamento(s)`} />
          <Kpi label="Resultado" value={fmt(resultado)} color={resultado >= 0 ? 'text-success' : 'text-destructive'} sub={`Margem ${receita > 0 ? ((resultado / receita) * 100).toFixed(1) : '0'}%`} />
          <Kpi label="Atraso Médio de Recebimento" value={`${pmr.toFixed(0)} dias`} color={pmr <= 5 ? 'text-success' : pmr <= 15 ? 'text-warning' : 'text-destructive'} sub={`${receivedIncome.length} recebimento(s) analisado(s)`} />
          <Kpi label="Inadimplência" value={`${inadimplenciaPct.toFixed(1)}%`} color={inadimplenciaPct <= 5 ? 'text-success' : inadimplenciaPct <= 15 ? 'text-warning' : 'text-destructive'} sub={`${fmt(overdueValue)} em atraso`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Curva ABC de Clientes</CardTitle></CardHeader>
          <CardContent><AbcList items={clientTotals} emptyText="Nenhum orçamento aprovado ainda." /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent><AbcList items={expenseByCategory} emptyText="Nenhuma despesa registrada." /></CardContent>
        </Card>
      </div>
    </div>
  );
}
