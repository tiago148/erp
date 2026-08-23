'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  api, FinanceCategory, FinanceCategoryInput, FinanceEntry, FinanceEntryInput,
  FinanceEntryType, FinanceEntryStatus, RecurrenceFrequency, Project, ProjectBillingItem, ProjectBillingItemInput,
  ProjectBillingStatus, Settings, FinanceAccount, FinanceAccountInput, FinanceClosure, TransferFinanceEntryInput,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FinanceCategoryForm } from '@/components/finance-category-form';
import { FinanceEntryForm } from '@/components/finance-entry-form';
import { FinanceAccountForm } from '@/components/finance-account-form';
import { FinanceTransferForm } from '@/components/finance-transfer-form';
import { FinanceAttachmentUploader } from '@/components/finance-attachment-uploader';
import { ProjectBillingItemForm } from '@/components/project-billing-item-form';
import { FinanceImportWizard } from '@/components/finance-import-wizard';
import { ProjectFinancialAnalysisView } from '@/components/project-financial-analysis-view';
import { PrintDocument, PrintHeader, PrintSectionTitle, PrintFooter } from '@/components/print-document';
import { usePrint } from '@/lib/use-print';
import { downloadCsv } from '@/lib/export-csv';
import {
  Plus, Pencil, Trash2, Check, X, Receipt, AlertTriangle, Download, Paperclip, Printer,
  ArrowLeftRight, Lock, Unlock, History,
} from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

const typeLabels: Record<FinanceEntryType, string> = { INCOME: 'Receita', EXPENSE: 'Despesa' };
const typeColors: Record<FinanceEntryType, string> = {
  INCOME: 'bg-success/15 text-success',
  EXPENSE: 'bg-destructive/15 text-destructive',
};
const statusLabels: Record<FinanceEntryStatus, string> = {
  PENDING: 'Pendente', PAID: 'Pago', CANCELLED: 'Cancelado',
};
const statusColors: Record<FinanceEntryStatus, string> = {
  PENDING: 'bg-warning/15 text-warning',
  PAID: 'bg-success/15 text-success',
  CANCELLED: 'bg-destructive/15 text-destructive',
};
const recurrenceLabels: Record<RecurrenceFrequency, string> = {
  NONE: '-', WEEKLY: 'Semanal', MONTHLY: 'Mensal', YEARLY: 'Anual',
};

function PayablesReceivablesTab({ type }: { type: FinanceEntryType }) {
  const { token } = useAuth();
  const [items, setItems] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems(await api.listFinanceEntries(token, { type, status: 'PENDING' }));
    } finally {
      setLoading(false);
    }
  }, [token, type]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: FinanceEntryInput) {
    if (!token) return;
    if (editing) await api.updateFinanceEntry(token, editing.id, data);
    else await api.createFinanceEntry(token, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handlePay(entry: FinanceEntry) {
    if (!token || !confirm(`Confirmar ${type === 'INCOME' ? 'recebimento' : 'pagamento'} de "${entry.description}" no valor de ${fmt(entry.amount)}?`)) return;
    await api.payFinanceEntry(token, entry.id);
    load();
  }

  async function handleCancel(entry: FinanceEntry) {
    if (!token || !confirm(`Cancelar o lançamento "${entry.description}"?`)) return;
    await api.cancelFinanceEntry(token, entry.id);
    load();
  }

  function vinculo(entry: FinanceEntry) {
    return entry.project?.name || entry.supplier?.name || entry.client?.name || '-';
  }

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const in7Key = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const overdue = items.filter((e) => e.dueDate.slice(0, 10) < todayKey);
  const dueSoon = items.filter((e) => e.dueDate.slice(0, 10) >= todayKey && e.dueDate.slice(0, 10) <= in7Key);
  const totalPending = items.reduce((s, e) => s + e.amount, 0);
  const overdueTotal = overdue.reduce((s, e) => s + e.amount, 0);
  const dueSoonTotal = dueSoon.reduce((s, e) => s + e.amount, 0);
  const recurringCount = items.filter((e) => e.recurrence !== 'NONE').length;

  const actionLabel = type === 'INCOME' ? 'Receber' : 'Pagar';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Pendente</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(totalPending)}</p><p className="text-xs text-muted-foreground">{items.length} lançamento(s)</p></CardContent>
        </Card>
        <Card className={overdue.length > 0 ? 'border-destructive/40' : undefined}>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Vencidas</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-destructive">{fmt(overdueTotal)}</p><p className="text-xs text-muted-foreground">{overdue.length} lançamento(s)</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Vence em 7 dias</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-warning">{fmt(dueSoonTotal)}</p><p className="text-xs text-muted-foreground">{dueSoon.length} lançamento(s)</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Recorrentes</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{recurringCount}</p></CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Nova Conta a {actionLabel}</Button>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Vínculo</TableHead><TableHead>Recorrência</TableHead><TableHead>Valor</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma conta pendente.</TableCell></TableRow>
            ) : items.map((entry) => {
              const isOverdue = entry.dueDate.slice(0, 10) < todayKey;
              return (
                <TableRow key={entry.id} className={isOverdue ? 'bg-destructive/5' : undefined}>
                  <TableCell className={isOverdue ? 'text-destructive font-medium' : undefined}>{fmtDate(entry.dueDate)}</TableCell>
                  <TableCell className="font-medium">{entry.description}</TableCell>
                  <TableCell>{entry.category?.name || '-'}</TableCell>
                  <TableCell>{vinculo(entry)}</TableCell>
                  <TableCell>{recurrenceLabels[entry.recurrence]}</TableCell>
                  <TableCell className="font-semibold">{fmt(entry.amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title={actionLabel} onClick={() => handlePay(entry)}><Check size={16} /></Button>
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => { setEditing(entry); setOpen(true); }}><Pencil size={16} /></Button>
                      <Button variant="ghost" size="icon" title="Cancelar" onClick={() => handleCancel(entry)}><X size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Lançamento' : `Nova Conta a ${actionLabel}`}</DialogTitle></DialogHeader>
          <FinanceEntryForm initialData={editing} defaultType={type} onSubmit={handleSubmit} onCancel={() => { setOpen(false); setEditing(undefined); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EntriesTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | undefined>();
  const [attaching, setAttaching] = useState<FinanceEntry | undefined>();
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

  function handleExport() {
    downloadCsv('lancamentos-financeiros.csv', [
      ['Vencimento', 'Descrição', 'Tipo', 'Categoria', 'Vínculo', 'Valor', 'Status'],
      ...items.map((entry) => [
        fmtDate(entry.dueDate), entry.description, typeLabels[entry.type], entry.category?.name || '-',
        vinculo(entry), entry.amount, statusLabels[entry.status],
      ]),
    ]);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download size={16} className="mr-2" />Exportar CSV</Button>
          <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Novo Lançamento</Button>
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
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
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum lançamento encontrado.</TableCell></TableRow>
            ) : items.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{fmtDate(entry.dueDate)}</TableCell>
                <TableCell className="font-medium">
                  {entry.description}
                  {entry.recurrence !== 'NONE' && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-info/15 text-info">{recurrenceLabels[entry.recurrence]}</span>}
                </TableCell>
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
                    <Button variant="ghost" size="icon" title="Anexos (nota fiscal)" onClick={() => setAttaching(entry)}><Paperclip size={16} /></Button>
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

      <Dialog open={!!attaching} onOpenChange={(v) => !v && setAttaching(undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Anexos — {attaching?.description}</DialogTitle></DialogHeader>
          {attaching && <FinanceAttachmentUploader financeEntryId={attaching.id} />}
        </DialogContent>
      </Dialog>

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
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead className="w-24">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhuma categoria cadastrada.</TableCell></TableRow>
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

const accountTypeLabels: Record<string, string> = { CAIXA: 'Caixa', BANCO: 'Banco' };

function AccountsTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceAccount | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listFinanceAccounts(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: FinanceAccountInput) {
    if (!token) return;
    if (editing) await api.updateFinanceAccount(token, editing.id, data);
    else await api.createFinanceAccount(token, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleDelete(a: FinanceAccount) {
    if (!token || !confirm(`Excluir a conta "${a.name}"?`)) return;
    try {
      await api.deleteFinanceAccount(token, a.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível excluir esta conta.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Nova Conta</Button>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Saldo inicial</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma conta cadastrada.</TableCell></TableRow>
            ) : items.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}{a.isDefault && <Badge variant="info" className="ml-2">Padrão</Badge>}</TableCell>
                <TableCell>{accountTypeLabels[a.type]}</TableCell>
                <TableCell className="font-mono">{fmt(a.initialBalance)}</TableCell>
                <TableCell>{a.active ? <Badge variant="success">Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Editar Conta' : 'Nova Conta'}</DialogTitle></DialogHeader>
          <FinanceAccountForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const closureStatusLabels: Record<string, string> = { OPEN: 'Aberto', REVIEWING: 'Em Conferência', CLOSED: 'Fechado' };
const closureStatusVariant: Record<string, 'warning' | 'info' | 'success'> = { OPEN: 'warning', REVIEWING: 'info', CLOSED: 'success' };

function FechamentoTab() {
  const { token, user } = useAuth();
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [closure, setClosure] = useState<FinanceClosure | null>(null);
  const [history, setHistory] = useState<FinanceClosure[]>([]);
  const [loading, setLoading] = useState(false);
  const [informedBalance, setInformedBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [printing, setPrinting] = usePrint<FinanceClosure>();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    if (!token) return;
    api.listFinanceAccounts(token).then((list) => {
      setAccounts(list);
      setAccountId((prev) => prev || list.find((a) => a.isDefault)?.id || list[0]?.id || '');
    });
    api.getSettings(token).then(setSettings);
  }, [token]);

  const load = useCallback(async () => {
    if (!token || !accountId || !date) return;
    setLoading(true);
    setError('');
    try {
      const [current, hist] = await Promise.all([
        api.getCurrentFinanceClosure(token, accountId, date),
        api.listFinanceClosures(token, accountId),
      ]);
      setClosure(current);
      setInformedBalance(current.informedBalance !== null ? String(current.informedBalance) : '');
      setNotes(current.notes || '');
      setHistory(hist.filter((h) => h.id !== current.id).slice(0, 8));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fechamento');
      setClosure(null);
    } finally {
      setLoading(false);
    }
  }, [token, accountId, date]);

  useEffect(() => { load(); }, [load]);

  async function handleStartReview() {
    if (!token || !closure || closure.status !== 'OPEN') return;
    await api.startReviewFinanceClosure(token, closure.id);
  }

  async function handleClose() {
    if (!token || !closure) return;
    setClosing(true);
    setError('');
    try {
      await api.closeFinanceClosure(token, closure.id, {
        informedBalance: parseFloat(informedBalance) || 0,
        notes: notes || undefined,
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fechar');
    } finally {
      setClosing(false);
    }
  }

  async function handleReopen() {
    if (!token || !closure) return;
    const reason = prompt('Motivo da reabertura deste fechamento:');
    if (!reason) return;
    await api.reopenFinanceClosure(token, closure.id, { reason });
    load();
  }

  async function handleTransfer(data: TransferFinanceEntryInput) {
    if (!token) return;
    await api.transferFinanceEntry(token, data);
    setTransferOpen(false);
    load();
  }

  const liveDiff = closure && informedBalance !== ''
    ? Math.round((parseFloat(informedBalance) - closure.expectedBalance) * 100) / 100
    : null;
  const hasDifference = liveDiff !== null && liveDiff !== 0;
  const isClosed = closure?.status === 'CLOSED';
  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="flex gap-3">
          <div className="space-y-2 w-56">
            <Label>Conta/Caixa</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{selectedAccount?.name}</SelectValue></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <Button variant="outline" onClick={() => setTransferOpen(true)}><ArrowLeftRight size={16} className="mr-2" />Transferir entre Contas</Button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada — crie uma na aba &quot;Contas&quot;.</p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : closure ? (
        <Card className="max-w-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Fechamento do dia {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={closureStatusVariant[closure.status]}>{closureStatusLabels[closure.status]}</Badge>
              {isClosed && (
                <Button variant="ghost" size="icon" title="Imprimir comprovante" onClick={() => setPrinting(closure)}><Printer size={16} /></Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Saldo inicial</p><p className="font-semibold font-mono text-lg">{fmt(closure.initialBalance)}</p></div>
              <div><p className="text-muted-foreground">Saldo esperado</p><p className="font-semibold font-mono text-lg">{fmt(closure.expectedBalance)}</p></div>
              <div><p className="text-muted-foreground">Entradas</p><p className="font-medium font-mono text-success">+ {fmt(closure.totalIncome)}</p></div>
              <div><p className="text-muted-foreground">Saídas</p><p className="font-medium font-mono text-destructive">- {fmt(closure.totalExpense)}</p></div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <Label>Saldo conferido</Label>
              <Input
                type="number" step="0.01" placeholder="0,00"
                value={informedBalance}
                onChange={(e) => setInformedBalance(e.target.value)}
                onFocus={handleStartReview}
                disabled={isClosed}
                className="text-lg font-mono"
              />
            </div>

            {liveDiff !== null && (
              <div className={`flex items-center justify-between rounded-md p-3 text-sm ${hasDifference ? 'bg-warning/10 border border-warning/30' : 'bg-success/10 border border-success/30'}`}>
                <span className="flex items-center gap-2">
                  {hasDifference ? <AlertTriangle size={16} className="text-warning" /> : <Check size={16} className="text-success" />}
                  {hasDifference ? `Existe uma diferença de ${fmt(Math.abs(liveDiff))}` : 'Tudo conferido'}
                </span>
                <span className={`font-mono font-semibold ${hasDifference ? 'text-warning' : 'text-success'}`}>{fmt(liveDiff)}</span>
              </div>
            )}

            {!isClosed && hasDifference && (
              <div className="space-y-2">
                <Label>Observação / motivo da diferença (obrigatório)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ex: falta de troco, despesa não lançada, etc." />
              </div>
            )}

            {isClosed && (
              <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
                <p>Fechado por {closure.closedByEmail} em {closure.closedAt && new Date(closure.closedAt).toLocaleString('pt-BR')}</p>
                {closure.notes && <p>Observação: {closure.notes}</p>}
                {user?.role === 'ADMIN' && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleReopen}><Unlock size={14} className="mr-2" />Reabrir (admin)</Button>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {!isClosed && (
              <Button className="w-full" disabled={closing || informedBalance === ''} onClick={handleClose}>
                <Lock size={16} className="mr-2" />
                {closing ? 'Fechando...' : hasDifference ? 'Fechar mesmo assim' : 'Fechar Caixa'}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {history.length > 0 && (
        <div className="max-w-xl">
          <p className="text-sm font-semibold mb-2 flex items-center gap-2"><History size={14} />Histórico recente</p>
          <div className="border rounded-md bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Data</TableHead><TableHead>Esperado</TableHead><TableHead>Informado</TableHead><TableHead>Diferença</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.periodStart).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                    <TableCell className="font-mono">{fmt(h.expectedBalance)}</TableCell>
                    <TableCell className="font-mono">{h.informedBalance !== null ? fmt(h.informedBalance) : '-'}</TableCell>
                    <TableCell className={`font-mono ${h.difference ? 'text-warning' : ''}`}>{h.difference !== null ? fmt(h.difference) : '-'}</TableCell>
                    <TableCell><Badge variant={closureStatusVariant[h.status]}>{closureStatusLabels[h.status]}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Transferir entre Contas</DialogTitle></DialogHeader>
          <FinanceTransferForm accounts={accounts} onSubmit={handleTransfer} onCancel={() => setTransferOpen(false)} />
        </DialogContent>
      </Dialog>

      {printing && (
        <PrintDocument>
          <PrintHeader
            settings={settings}
            docTitle="COMPROVANTE DE FECHAMENTO DE CAIXA"
            docSubtitle={<>{printing.account.name}<br />{new Date(printing.periodStart).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</>}
          />
          <PrintSectionTitle>Movimentação do Período</PrintSectionTitle>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b"><td className="py-1">Saldo inicial</td><td className="text-right">{fmt(printing.initialBalance)}</td></tr>
              <tr className="border-b"><td className="py-1">Entradas</td><td className="text-right">+ {fmt(printing.totalIncome)}</td></tr>
              <tr className="border-b"><td className="py-1">Saídas</td><td className="text-right">- {fmt(printing.totalExpense)}</td></tr>
              <tr className="border-b font-semibold"><td className="py-1">Saldo esperado</td><td className="text-right">{fmt(printing.expectedBalance)}</td></tr>
              <tr className="border-b"><td className="py-1">Saldo conferido</td><td className="text-right">{printing.informedBalance !== null ? fmt(printing.informedBalance) : '-'}</td></tr>
              <tr className="font-bold"><td className="py-1">Diferença</td><td className="text-right">{printing.difference !== null ? fmt(printing.difference) : '-'}</td></tr>
            </tbody>
          </table>
          {printing.notes && (<><PrintSectionTitle>Observações</PrintSectionTitle><p className="text-sm">{printing.notes}</p></>)}
          <p className="text-xs text-gray-600 mt-4">Fechado por {printing.closedByEmail} em {printing.closedAt && new Date(printing.closedAt).toLocaleString('pt-BR')}</p>
          <PrintFooter settings={settings} />
        </PrintDocument>
      )}
    </div>
  );
}

const billingStatusLabels: Record<ProjectBillingStatus, string> = {
  PLANNED: 'Previsto', INVOICED: 'Faturado', CANCELLED: 'Cancelado',
};
const billingStatusColors: Record<ProjectBillingStatus, string> = {
  PLANNED: 'bg-secondary text-secondary-foreground',
  INVOICED: 'bg-info/15 text-info',
  CANCELLED: 'bg-destructive/15 text-destructive',
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
        <p className="text-muted-foreground text-sm">Selecione um projeto para ver o cronograma de faturamento.</p>
      ) : (
        <div className="border rounded-md bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Prevista</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead>
                <TableHead>Status</TableHead><TableHead>Lançamento</TableHead><TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum item de faturamento para este projeto.</TableCell></TableRow>
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

const dreePeriodLabels: Record<string, string> = {
  mes: 'Este mês', '3m': 'Últimos 3 meses', ano: 'Este ano', tudo: 'Todo o período',
};

function DreTab() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'mes' | '3m' | 'ano' | 'tudo'>('mes');
  const [printing, setPrinting] = usePrint<boolean>();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.listFinanceEntries(token).then((data) => { setEntries(data); setLoading(false); });
  }, [token]);
  useEffect(() => { if (token) api.getSettings(token).then(setSettings); }, [token]);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  const now = new Date();
  const periodStart = period === 'tudo' ? null
    : period === 'ano' ? new Date(now.getFullYear(), 0, 1)
    : period === '3m' ? new Date(now.getFullYear(), now.getMonth() - 2, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const paid = entries.filter((e): e is FinanceEntry & { paidAt: string } => e.status === 'PAID' && !!e.paidAt);
  const inPeriod = periodStart ? paid.filter((e) => new Date(e.paidAt) >= periodStart) : paid;

  function byCategory(type: FinanceEntryType) {
    const map = new Map<string, number>();
    for (const e of inPeriod.filter((x) => x.type === type)) {
      map.set(e.category.name, (map.get(e.category.name) || 0) + (e.paidAmount ?? e.amount));
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }

  const incomeByCategory = byCategory('INCOME');
  const expenseByCategory = byCategory('EXPENSE');
  const totalReceitas = incomeByCategory.reduce((s, c) => s + c.value, 0);
  const totalDespesas = expenseByCategory.reduce((s, c) => s + c.value, 0);
  const resultado = totalReceitas - totalDespesas;
  const margem = totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="w-56">
          <Select value={period} onValueChange={(v) => setPeriod((v || 'mes') as typeof period)}>
            <SelectTrigger className="w-full"><SelectValue>{dreePeriodLabels[period]}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Este mês</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="ano">Este ano</SelectItem>
              <SelectItem value="tudo">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => setPrinting(true)}><Printer size={16} className="mr-2" />Gerar PDF</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Receitas</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-success">{fmt(totalReceitas)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Despesas</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-destructive">{fmt(totalDespesas)}</p></CardContent></Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Resultado</CardTitle></CardHeader>
          <CardContent><p className={`text-xl font-bold ${resultado >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(resultado)} <span className="text-xs text-muted-foreground font-normal">({margem.toFixed(1)}%)</span></p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-md bg-card p-4">
          <p className="font-semibold text-sm mb-2">Receitas por categoria</p>
          {incomeByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma receita no período.</p>
          ) : incomeByCategory.map((c) => (
            <div key={c.name} className="flex justify-between text-sm py-1 border-b last:border-0"><span>{c.name}</span><span className="font-medium">{fmt(c.value)}</span></div>
          ))}
        </div>
        <div className="border rounded-md bg-card p-4">
          <p className="font-semibold text-sm mb-2">Despesas por categoria</p>
          {expenseByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma despesa no período.</p>
          ) : expenseByCategory.map((c) => (
            <div key={c.name} className="flex justify-between text-sm py-1 border-b last:border-0"><span>{c.name}</span><span className="font-medium">{fmt(c.value)}</span></div>
          ))}
        </div>
      </div>

      {printing && (
        <PrintDocument>
          <PrintHeader
            settings={settings}
            docTitle="DEMONSTRATIVO DE RESULTADO"
            docSubtitle={<>{dreePeriodLabels[period]}<br />Emitido em {new Date().toLocaleDateString('pt-BR')}</>}
          />
          <PrintSectionTitle>Receitas</PrintSectionTitle>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {incomeByCategory.map((c) => (
                <tr key={c.name} className="border-b"><td className="py-1">{c.name}</td><td className="text-right">{fmt(c.value)}</td></tr>
              ))}
              <tr className="font-semibold"><td className="py-1.5">Total de Receitas</td><td className="text-right">{fmt(totalReceitas)}</td></tr>
            </tbody>
          </table>
          <PrintSectionTitle>Despesas</PrintSectionTitle>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {expenseByCategory.map((c) => (
                <tr key={c.name} className="border-b"><td className="py-1">{c.name}</td><td className="text-right">{fmt(c.value)}</td></tr>
              ))}
              <tr className="font-semibold"><td className="py-1.5">Total de Despesas</td><td className="text-right">{fmt(totalDespesas)}</td></tr>
            </tbody>
          </table>
          <div className="flex justify-between text-base py-2 mt-2 font-bold border-t-2 border-black">
            <span>RESULTADO LÍQUIDO ({margem.toFixed(1)}%)</span><span>{fmt(resultado)}</span>
          </div>
          <PrintFooter settings={settings} />
        </PrintDocument>
      )}
    </div>
  );
}

function AnaliseObraTab() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listProjects(token).then((all) => {
      const withBudget = all.filter((p) => !!p.budgetId);
      setProjects(withBudget);
      if (withBudget.length > 0) setProjectId((prev) => prev || withBudget[0].id);
    });
  }, [token]);

  return (
    <div className="space-y-4">
      <div className="max-w-sm space-y-2">
        <Label>Projeto</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um projeto">
              {projects.find((p) => p.id === projectId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.number} — {p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {projects.length === 0 && (
          <p className="text-xs text-warning">Nenhum projeto com orçamento vinculado ainda.</p>
        )}
      </div>

      {projectId && <ProjectFinancialAnalysisView projectId={projectId} />}
    </div>
  );
}

function CashFlowTab() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = usePrint<boolean>();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.listFinanceEntries(token).then((data) => { setEntries(data); setLoading(false); });
  }, [token]);
  useEffect(() => { if (token) api.getSettings(token).then(setSettings); }, [token]);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

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
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm">
          <AlertTriangle size={16} />
          {overdue.length} lançamento(s) vencido(s) e ainda pendente(s) — {fmt(overdueIncome)} a receber e {fmt(overdueExpense)} a pagar.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">A Receber (pendente)</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-success">{fmt(pendingIncome)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">A Pagar (pendente)</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-destructive">{fmt(pendingExpense)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Recebido</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-success">{fmt(paidIncome)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Pago</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-destructive">{fmt(paidExpense)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Saldo Realizado</CardTitle></CardHeader><CardContent><p className={`text-xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(balance)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Fluxo de Caixa Mensal</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setPrinting(true)}><Printer size={14} className="mr-2" />Gerar PDF</Button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e3138" />
                <XAxis dataKey="mes" fontSize={12} tick={{ fill: '#8b929e' }} />
                <YAxis fontSize={12} tickFormatter={(v) => fmt(v)} width={90} tick={{ fill: '#8b929e' }} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#1e2026', border: '1px solid #2e3138', borderRadius: 8, color: '#d8dce6' }} />
                <Legend wrapperStyle={{ color: '#8b929e' }} />
                <Bar dataKey="Recebido" stackId="entradas" fill="#4caf82" />
                <Bar dataKey="Previsto (receita)" stackId="entradas" fill="#8fd4b0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pago" stackId="saidas" fill="#e05555" />
                <Bar dataKey="Previsto (despesa)" stackId="saidas" fill="#ea9494" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {printing && (
        <PrintDocument>
          <PrintHeader
            settings={settings}
            docTitle="FLUXO DE CAIXA"
            docSubtitle={<>Projeção de 7 meses<br />Emitido em {new Date().toLocaleDateString('pt-BR')}</>}
          />
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr className="border-b font-semibold text-left">
                <th className="py-1">Mês</th><th className="text-right">Recebido</th><th className="text-right">Pago</th>
                <th className="text-right">Previsto (receita)</th><th className="text-right">Previsto (despesa)</th><th className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.mes} className="border-b">
                  <td className="py-1">{m.mes}</td><td className="text-right">{fmt(m.Recebido)}</td><td className="text-right">{fmt(m.Pago)}</td>
                  <td className="text-right">{fmt(m['Previsto (receita)'])}</td><td className="text-right">{fmt(m['Previsto (despesa)'])}</td>
                  <td className="text-right font-medium">{fmt(m.Recebido - m.Pago)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <PrintFooter settings={settings} />
        </PrintDocument>
      )}
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Lançamentos, contas a pagar e a receber.</p>
      </div>
      <Tabs defaultValue="a-pagar">
        <TabsList>
          <TabsTrigger value="a-pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="a-receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="fluxo-caixa">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="obra">Análise por Obra</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="contas">Contas</TabsTrigger>
          <TabsTrigger value="importar">Importar CSV</TabsTrigger>
        </TabsList>
        <TabsContent value="a-pagar"><PayablesReceivablesTab type="EXPENSE" /></TabsContent>
        <TabsContent value="a-receber"><PayablesReceivablesTab type="INCOME" /></TabsContent>
        <TabsContent value="lancamentos"><EntriesTab /></TabsContent>
        <TabsContent value="fechamento"><FechamentoTab /></TabsContent>
        <TabsContent value="dre"><DreTab /></TabsContent>
        <TabsContent value="fluxo-caixa"><CashFlowTab /></TabsContent>
        <TabsContent value="obra"><AnaliseObraTab /></TabsContent>
        <TabsContent value="faturamento"><BillingTab /></TabsContent>
        <TabsContent value="categorias"><CategoriesTab /></TabsContent>
        <TabsContent value="contas"><AccountsTab /></TabsContent>
        <TabsContent value="importar"><FinanceImportWizard /></TabsContent>
      </Tabs>
    </div>
  );
}
