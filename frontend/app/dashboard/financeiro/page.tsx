'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  api, FinanceCategory, FinanceCategoryInput, FinanceEntry, FinanceEntryInput,
  FinanceEntryType, FinanceEntryStatus, Project, ProjectBillingItem, ProjectBillingItemInput,
  ProjectBillingStatus,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FinanceCategoryForm } from '@/components/finance-category-form';
import { FinanceEntryForm } from '@/components/finance-entry-form';
import { ProjectBillingItemForm } from '@/components/project-billing-item-form';
import { FinanceImportWizard } from '@/components/finance-import-wizard';
import { Plus, Pencil, Trash2, Check, X, Receipt, AlertTriangle } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

const typeLabels: Record<FinanceEntryType, string> = { INCOME: 'Receita', EXPENSE: 'Despesa' };
const typeColors: Record<FinanceEntryType, string> = {
  INCOME: 'bg-green-100 text-green-700',
  EXPENSE: 'bg-red-100 text-red-700',
};
const statusLabels: Record<FinanceEntryStatus, string> = {
  PENDING: 'Pendente', PAID: 'Pago', CANCELLED: 'Cancelado',
};
const statusColors: Record<FinanceEntryStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function EntriesTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | undefined>();
  const [typeFilter, setTypeFilter] = useState<FinanceEntryType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<FinanceEntryStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems(await api.listFinanceEntries(token, {
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search || undefined,
      }));
    } finally {
      setLoading(false);
    }
  }, [token, typeFilter, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: FinanceEntryInput) {
    if (!token) return;
    if (editing) await api.updateFinanceEntry(token, editing.id, data);
    else await api.createFinanceEntry(token, data);
    setOpen(false);
    load();
  }

  async function handlePay(entry: FinanceEntry) {
    if (!token || !confirm(`Confirmar ${entry.type === 'INCOME' ? 'recebimento' : 'pagamento'} de "${entry.description}" no valor de ${fmt(entry.amount)}?`)) return;
    await api.payFinanceEntry(token, entry.id);
    load();
  }

  async function handleCancel(entry: FinanceEntry) {
    if (!token || !confirm(`Cancelar o lançamento "${entry.description}"?`)) return;
    await api.cancelFinanceEntry(token, entry.id);
    load();
  }

  async function handleDelete(entry: FinanceEntry) {
    if (!token || !confirm(`Excluir o lançamento "${entry.description}"?`)) return;
    await api.deleteFinanceEntry(token, entry.id);
    load();
  }

  function vinculo(entry: FinanceEntry) {
    return entry.project?.name || entry.supplier?.name || entry.client?.name || '-';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Buscar por descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as FinanceEntryType | 'ALL')}>
            <SelectTrigger className="w-36"><SelectValue>{typeFilter === 'ALL' ? 'Todos os tipos' : typeLabels[typeFilter]}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os tipos</SelectItem>
              <SelectItem value="INCOME">Receita</SelectItem>
              <SelectItem value="EXPENSE">Despesa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FinanceEntryStatus | 'ALL')}>
            <SelectTrigger className="w-36"><SelectValue>{statusFilter === 'ALL' ? 'Todos os status' : statusLabels[statusFilter]}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="PAID">Pago</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Novo Lançamento</Button>
      </div>

      <div className="border rounded-md bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead><TableHead>Vínculo</TableHead><TableHead>Valor</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-36">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-gray-500">Nenhum lançamento encontrado.</TableCell></TableRow>
            ) : items.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{fmtDate(entry.dueDate)}</TableCell>
                <TableCell className="font-medium">{entry.description}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[entry.type]}`}>{typeLabels[entry.type]}</span></TableCell>
                <TableCell>{entry.category?.name || '-'}</TableCell>
                <TableCell>{vinculo(entry)}</TableCell>
                <TableCell className="font-semibold">{fmt(entry.amount)}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[entry.status]}`}>{statusLabels[entry.status]}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {entry.status === 'PENDING' && (
                      <Button variant="ghost" size="icon" title={entry.type === 'INCOME' ? 'Receber' : 'Pagar'} onClick={() => handlePay(entry)}><Check size={16} /></Button>
                    )}
                    <Button variant="ghost" size="icon" title="Editar" onClick={() => { setEditing(entry); setOpen(true); }}><Pencil size={16} /></Button>
                    {entry.status === 'PENDING' && (
                      <>
                        <Button variant="ghost" size="icon" title="Cancelar" onClick={() => handleCancel(entry)}><X size={16} /></Button>
                        <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDelete(entry)}><Trash2 size={16} /></Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle></DialogHeader>
          <FinanceEntryForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoriesTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceCategory | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listFinanceCategories(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: FinanceCategoryInput) {
    if (!token) return;
    if (editing) await api.updateFinanceCategory(token, editing.id, data);
    else await api.createFinanceCategory(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(c: FinanceCategory) {
    if (!token || !confirm(`Excluir a categoria "${c.name}"?`)) return;
    try {
      await api.deleteFinanceCategory(token, c.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível excluir. Verifique se há lançamentos usando esta categoria.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Nova Categoria</Button>
      </div>
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead className="w-24">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-gray-500">Nenhuma categoria cadastrada.</TableCell></TableRow>
            ) : items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[c.type]}`}>{typeLabels[c.type]}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle></DialogHeader>
          <FinanceCategoryForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const billingStatusLabels: Record<ProjectBillingStatus, string> = {
  PLANNED: 'Previsto', INVOICED: 'Faturado', CANCELLED: 'Cancelado',
};
const billingStatusColors: Record<ProjectBillingStatus, string> = {
  PLANNED: 'bg-gray-100 text-gray-700',
  INVOICED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function BillingTab() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState<ProjectBillingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (token) api.listProjects(token).then(setProjects); }, [token]);

  const load = useCallback(async () => {
    if (!token || !projectId) { setItems([]); return; }
    setLoading(true);
    try { setItems(await api.listProjectBillingItems(token, projectId)); } finally { setLoading(false); }
  }, [token, projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: ProjectBillingItemInput) {
    if (!token) return;
    await api.createProjectBillingItem(token, data);
    setOpen(false);
    load();
  }

  async function handleInvoice(item: ProjectBillingItem) {
    if (!token || !confirm(`Faturar "${item.description}"? Isso vai gerar uma conta a receber de ${fmt(item.amount)}.`)) return;
    await api.invoiceProjectBillingItem(token, item.id);
    load();
  }

  async function handleCancel(item: ProjectBillingItem) {
    if (!token || !confirm(`Cancelar o item "${item.description}"?`)) return;
    await api.cancelProjectBillingItem(token, item.id);
    load();
  }

  async function handleDelete(item: ProjectBillingItem) {
    if (!token || !confirm(`Excluir o item "${item.description}"?`)) return;
    await api.deleteProjectBillingItem(token, item.id);
    load();
  }

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="space-y-2 w-72">
          <Label>Projeto</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione um projeto...">{selectedProject ? `${selectedProject.number} - ${selectedProject.name}` : undefined}</SelectValue></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button disabled={!projectId} onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Novo Item</Button>
      </div>

      {!projectId ? (
        <p className="text-gray-500 text-sm">Selecione um projeto para ver o cronograma de faturamento.</p>
      ) : (
        <div className="border rounded-md bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Prevista</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead>
                <TableHead>Status</TableHead><TableHead>Lançamento</TableHead><TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Nenhum item de faturamento para este projeto.</TableCell></TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{fmtDate(item.plannedDate)}</TableCell>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="font-semibold">{fmt(item.amount)}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${billingStatusColors[item.status]}`}>{billingStatusLabels[item.status]}</span></TableCell>
                  <TableCell>
                    {item.financeEntry ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.financeEntry.status]}`}>{statusLabels[item.financeEntry.status]}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.status === 'PLANNED' && (
                        <>
                          <Button variant="ghost" size="icon" title="Faturar" onClick={() => handleInvoice(item)}><Receipt size={16} /></Button>
                          <Button variant="ghost" size="icon" title="Cancelar" onClick={() => handleCancel(item)}><X size={16} /></Button>
                          <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDelete(item)}><Trash2 size={16} /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Item de Faturamento</DialogTitle></DialogHeader>
          <ProjectBillingItemForm projectId={projectId} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

function CashFlowTab() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.listFinanceEntries(token).then((data) => { setEntries(data); setLoading(false); });
  }, [token]);

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  const active = entries.filter((e) => e.status !== 'CANCELLED');
  const paid = active.filter((e) => e.status === 'PAID');
  const pending = active.filter((e) => e.status === 'PENDING');

  const paidIncome = paid.filter((e) => e.type === 'INCOME').reduce((s, e) => s + (e.paidAmount ?? e.amount), 0);
  const paidExpense = paid.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + (e.paidAmount ?? e.amount), 0);
  const pendingIncome = pending.filter((e) => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0);
  const pendingExpense = pending.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);
  const balance = paidIncome - paidExpense;

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const overdue = pending.filter((e) => e.dueDate.slice(0, 10) < todayKey);
  const overdueIncome = overdue.filter((e) => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0);
  const overdueExpense = overdue.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);

  const months: { key: string; label: string }[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ key: monthKey(d), label: monthLabel(d) });
  }

  const monthly = months.map(({ key, label }) => {
    let recebido = 0, pago = 0, previstoReceita = 0, previstoDespesa = 0;
    for (const e of active) {
      const refDate = e.status === 'PAID' ? e.paidAt : e.dueDate;
      if (!refDate) continue;
      const d = new Date(refDate);
      const k = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      if (k !== key) continue;
      const amount = e.status === 'PAID' ? (e.paidAmount ?? e.amount) : e.amount;
      if (e.status === 'PAID' && e.type === 'INCOME') recebido += amount;
      else if (e.status === 'PAID' && e.type === 'EXPENSE') pago += amount;
      else if (e.status === 'PENDING' && e.type === 'INCOME') previstoReceita += amount;
      else if (e.status === 'PENDING' && e.type === 'EXPENSE') previstoDespesa += amount;
    }
    return { mes: label, Recebido: round2(recebido), Pago: round2(pago), 'Previsto (receita)': round2(previstoReceita), 'Previsto (despesa)': round2(previstoDespesa) };
  });

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
          <AlertTriangle size={16} />
          {overdue.length} lançamento(s) vencido(s) e ainda pendente(s) — {fmt(overdueIncome)} a receber e {fmt(overdueExpense)} a pagar.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500">A Receber (pendente)</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-green-700">{fmt(pendingIncome)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500">A Pagar (pendente)</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-red-700">{fmt(pendingExpense)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500">Recebido</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-green-700">{fmt(paidIncome)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500">Pago</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-red-700">{fmt(paidExpense)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500">Saldo Realizado</CardTitle></CardHeader><CardContent><p className={`text-xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(balance)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Fluxo de Caixa Mensal</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => fmt(v)} width={90} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="Recebido" fill="#22c55e" />
                <Bar dataKey="Pago" fill="#ef4444" />
                <Bar dataKey="Previsto (receita)" fill="#86efac" />
                <Bar dataKey="Previsto (despesa)" fill="#fca5a5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-gray-500">Lançamentos, contas a pagar e a receber.</p>
      </div>
      <Tabs defaultValue="lancamentos">
        <TabsList>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="fluxo-caixa">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="importar">Importar CSV</TabsTrigger>
        </TabsList>
        <TabsContent value="lancamentos"><EntriesTab /></TabsContent>
        <TabsContent value="fluxo-caixa"><CashFlowTab /></TabsContent>
        <TabsContent value="faturamento"><BillingTab /></TabsContent>
        <TabsContent value="categorias"><CategoriesTab /></TabsContent>
        <TabsContent value="importar"><FinanceImportWizard /></TabsContent>
      </Tabs>
    </div>
  );
}
