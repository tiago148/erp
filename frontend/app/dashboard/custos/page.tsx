'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, FixedExpense, FixedExpenseInput, Settings, OverheadMethod } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FixedExpenseForm } from '@/components/fixed-expense-form';
import { computeIndirectCost } from '@/lib/overhead';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function FixedExpensesTab() {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setExpenses(await api.listFixedExpenses(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: FixedExpenseInput) {
    if (!token) return;
    await api.createFixedExpense(token, data);
    setOpen(false);
    load();
  }

  async function handleUpdate(data: FixedExpenseInput) {
    if (!token || !editing) return;
    await api.updateFixedExpense(token, editing.id, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleDelete(expense: FixedExpense) {
    if (!token || !confirm(`Excluir a despesa fixa "${expense.description}"?`)) return;
    await api.deleteFixedExpense(token, expense.id);
    load();
  }

  const totalMonthly = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tudo que a empresa paga todo mês independente de ter obra: aluguel, contador, pró-labore, salários administrativos,
        softwares, seguros. É a base do cálculo da taxa administrativa que entra nos orçamentos.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Despesa Fixa Mensal</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-mono text-destructive">{fmt(totalMonthly)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Custo Anual da Estrutura</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-mono text-warning">{fmt(totalMonthly * 12)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Itens Cadastrados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{expenses.length}</p></CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Nova Despesa</Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Valor Mensal</TableHead><TableHead>Tipo</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : expenses.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma despesa fixa cadastrada.</TableCell></TableRow>
            ) : expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {expense.description}
                  {expense.generatesBill && <Badge variant="accent" className="ml-2">conta automática</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground">{expense.category}</TableCell>
                <TableCell className="font-mono text-destructive">{fmt(expense.amount)}</TableCell>
                <TableCell>{expense.type === 'FIXED' ? 'Fixo' : 'Semivariável'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(expense); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(expense)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}</DialogTitle></DialogHeader>
          <FixedExpenseForm
            initialData={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setOpen(false); setEditing(undefined); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const methodInfo: Record<OverheadMethod, { label: string; description: string }> = {
  DAY: { label: 'R$ por dia de projeto', description: 'Divide a despesa fixa pelos dias úteis produtivos do mês. Cada dia de obra carrega a mesma parcela de estrutura.' },
  HOUR: { label: 'R$ por hora produtiva', description: 'Divide a despesa fixa pelas horas de mão de obra vendáveis no mês.' },
  PERCENT: { label: '% sobre o custo direto', description: 'Aplica um percentual sobre o custo direto médio da empresa.' },
};

function OverheadTab() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fixedTotal, setFixedTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [method, setMethod] = useState<OverheadMethod>('DAY');
  const [funcCount, setFuncCount] = useState(5);
  const [hoursPerMonth, setHoursPerMonth] = useState(176);
  const [occupancyPct, setOccupancyPct] = useState(72);
  const [workDaysPerMonth, setWorkDaysPerMonth] = useState(22);
  const [avgDirectCost, setAvgDirectCost] = useState(0);
  const [autoApply, setAutoApply] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([api.getSettings(token), api.listFixedExpenses(token)]).then(([s, expenses]) => {
      setSettings(s);
      setFixedTotal(expenses.reduce((sum, e) => sum + e.amount, 0));
      setMethod(s.overheadMethod);
      setFuncCount(s.overheadFuncCount ?? 5);
      setHoursPerMonth(s.overheadHoursPerMonth ?? 176);
      setOccupancyPct(s.overheadOccupancyPct);
      setWorkDaysPerMonth(s.overheadWorkDaysPerMonth ?? 22);
      setAvgDirectCost(s.overheadAvgDirectCost ?? 0);
      setAutoApply(s.overheadAutoApply);
    });
  }, [token]);

  const occupancy = occupancyPct / 100;
  const productiveDays = workDaysPerMonth * occupancy;
  const productiveHours = funcCount * hoursPerMonth * occupancy;
  const previewSettings = {
    overheadMethod: method,
    overheadFuncCount: funcCount,
    overheadHoursPerMonth: hoursPerMonth,
    overheadOccupancyPct: occupancyPct,
    overheadWorkDaysPerMonth: workDaysPerMonth,
    overheadAvgDirectCost: avgDirectCost,
    overheadAutoApply: true,
  };
  const ratePerDay = computeIndirectCost(previewSettings, fixedTotal, 0, 0, 1);
  const ratePerHour = computeIndirectCost(previewSettings, fixedTotal, 0, 1, 0);
  const ratePct = avgDirectCost > 0 ? (fixedTotal / avgDirectCost) * 100 : 0;

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.updateSettings(token, {
        overheadMethod: method,
        overheadFuncCount: funcCount,
        overheadHoursPerMonth: hoursPerMonth,
        overheadOccupancyPct: occupancyPct,
        overheadWorkDaysPerMonth: workDaysPerMonth,
        overheadAvgDirectCost: avgDirectCost,
        overheadAutoApply: autoApply,
      });
      setSettings(updated);
      setMessage('Configuração de custos indiretos salva!');
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Método de Absorção</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.keys(methodInfo) as OverheadMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`text-left rounded-md border p-3 transition-colors ${
                    method === m ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80'
                  }`}
                >
                  <p className="text-sm font-semibold">{methodInfo[m].label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{methodInfo[m].description}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Funcionários produtivos</Label>
                <Input type="number" min={1} value={funcCount} onChange={(e) => setFuncCount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Dias úteis por mês</Label>
                <Input type="number" min={1} value={workDaysPerMonth} onChange={(e) => setWorkDaysPerMonth(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Horas úteis por mês</Label>
                <Input type="number" min={1} value={hoursPerMonth} onChange={(e) => setHoursPerMonth(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Fator de ocupação (%)</Label>
                <Input type="number" min={1} max={100} value={occupancyPct} onChange={(e) => setOccupancyPct(Number(e.target.value))} />
              </div>
            </div>
            {method === 'PERCENT' && (
              <div className="space-y-2">
                <Label>Custo direto médio mensal (R$)</Label>
                <Input type="number" min={0} step="0.01" value={avgDirectCost} onChange={(e) => setAvgDirectCost(Number(e.target.value))} />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
              <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} className="h-4 w-4 accent-primary" />
              Aplicar automaticamente em novos orçamentos
            </label>
            {message && <p className="text-sm text-success">{message}</p>}
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Configuração'}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resultado do Cálculo</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm py-1 border-b"><span className="text-muted-foreground">Despesa fixa mensal</span><span className="font-mono">{fmt(fixedTotal)}</span></div>
            {method === 'DAY' && (
              <>
                <div className="flex justify-between text-sm py-1 border-b"><span className="text-muted-foreground">Dias produtivos no mês</span><span className="font-mono">{productiveDays.toFixed(1)}</span></div>
                <div className="flex justify-between items-center py-2"><span className="font-medium">Taxa por dia de projeto</span><span className="font-mono text-lg font-bold text-primary">{fmt(ratePerDay)}</span></div>
              </>
            )}
            {method === 'HOUR' && (
              <>
                <div className="flex justify-between text-sm py-1 border-b"><span className="text-muted-foreground">Horas produtivas no mês</span><span className="font-mono">{productiveHours.toFixed(1)}</span></div>
                <div className="flex justify-between items-center py-2"><span className="font-medium">Taxa por hora produtiva</span><span className="font-mono text-lg font-bold text-primary">{fmt(ratePerHour)}</span></div>
              </>
            )}
            {method === 'PERCENT' && (
              <div className="flex justify-between items-center py-2"><span className="font-medium">Taxa sobre custo direto</span><span className="font-mono text-lg font-bold text-primary">{ratePct.toFixed(2)}%</span></div>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              {autoApply
                ? 'Com a aplicação automática ligada, todo orçamento novo ganha a linha "Custos Indiretos" antes do BDI.'
                : 'A aplicação automática está desligada — os orçamentos não recebem custo indireto até você ativar a opção ao lado.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CustosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custos</h1>
        <p className="text-muted-foreground">Despesas fixas e taxa administrativa aplicada aos orçamentos.</p>
      </div>
      <Tabs defaultValue="despesas">
        <TabsList>
          <TabsTrigger value="despesas">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="taxa">Taxa Administrativa</TabsTrigger>
        </TabsList>
        <TabsContent value="despesas"><FixedExpensesTab /></TabsContent>
        <TabsContent value="taxa"><OverheadTab /></TabsContent>
      </Tabs>
    </div>
  );
}
