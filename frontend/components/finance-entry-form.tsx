'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, FinanceCategory, FinanceEntry, FinanceEntryInput, FinanceEntryType, RecurrenceFrequency, Project, Supplier, Client, FinanceAccount } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  initialData?: FinanceEntry;
  defaultType?: FinanceEntryType;
  onSubmit: (data: FinanceEntryInput) => Promise<void>;
  onCancel: () => void;
}

const typeLabels: Record<FinanceEntryType, string> = { INCOME: 'Receita', EXPENSE: 'Despesa' };
const recurrenceLabels: Record<RecurrenceFrequency, string> = {
  NONE: 'Não se repete', WEEKLY: 'Semanal', MONTHLY: 'Mensal', YEARLY: 'Anual',
};

export function FinanceEntryForm({ initialData, defaultType, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [type, setType] = useState<FinanceEntryType>(initialData?.type || defaultType || 'EXPENSE');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate?.slice(0, 10) || '');
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>(initialData?.recurrence || 'NONE');
  const [accountId, setAccountId] = useState(initialData?.accountId || '');
  const [projectId, setProjectId] = useState(initialData?.projectId || '');
  const [supplierId, setSupplierId] = useState(initialData?.supplierId || '');
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [markAsFixedExpense, setMarkAsFixedExpense] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listProjects(token).then(setProjects);
    api.listSuppliers(token).then(setSuppliers);
    api.listClients(token).then(setClients);
    api.listFinanceAccounts(token).then((list) => {
      setAccounts(list);
      setAccountId((prev) => prev || list.find((a) => a.isDefault)?.id || '');
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.listFinanceCategories(token, type).then((list) => {
      setCategories(list);
      setCategoryId((prev) => (list.some((c) => c.id === prev) ? prev : ''));
    });
  }, [token, type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { setError('Selecione uma categoria.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        type,
        description,
        categoryId,
        amount: parseFloat(amount) || 0,
        dueDate,
        recurrence,
        accountId: accountId || undefined,
        projectId: projectId || undefined,
        supplierId: supplierId || undefined,
        clientId: clientId || undefined,
        notes: notes || undefined,
        markAsFixedExpense: markAsFixedExpense || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar lançamento');
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const selectedClient = clients.find((c) => c.id === clientId);
  const locked = !!initialData && initialData.status !== 'PENDING';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {locked && (
        <p className="text-xs text-warning bg-warning/10 border border-warning/30 rounded-md p-2">
          Este lançamento já foi {initialData?.status === 'PAID' ? 'pago/recebido' : 'cancelado'} — tipo, valor e vencimento ficam travados para preservar o histórico. Descrição, categoria, vínculos e observações ainda podem ser corrigidos.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as FinanceEntryType)} disabled={locked}>
            <SelectTrigger className="w-full"><SelectValue>{typeLabels[type]}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Receita</SelectItem>
              <SelectItem value="EXPENSE">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{selectedCategory?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {categories.length === 0 && <p className="text-xs text-warning">Nenhuma categoria de {typeLabels[type].toLowerCase()} cadastrada.</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input type="number" step="0.01" min="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={locked} required />
        </div>
        <div className="space-y-2">
          <Label>Vencimento</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={locked} required />
        </div>
        <div className="space-y-2">
          <Label>Recorrência</Label>
          <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceFrequency)}>
            <SelectTrigger className="w-full"><SelectValue>{recurrenceLabels[recurrence]}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">{recurrenceLabels.NONE}</SelectItem>
              <SelectItem value="WEEKLY">{recurrenceLabels.WEEKLY}</SelectItem>
              <SelectItem value="MONTHLY">{recurrenceLabels.MONTHLY}</SelectItem>
              <SelectItem value="YEARLY">{recurrenceLabels.YEARLY}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {recurrence !== 'NONE' && (
        <p className="text-xs text-muted-foreground -mt-2">Ao marcar este lançamento como pago/recebido, a próxima ocorrência é criada automaticamente com o mesmo valor, avançando o vencimento pela frequência escolhida.</p>
      )}

      {!initialData && type === 'EXPENSE' && (
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer hover:bg-muted w-fit">
            <input
              type="checkbox"
              checked={markAsFixedExpense}
              onChange={(e) => setMarkAsFixedExpense(e.target.checked)}
            />
            É uma despesa fixa
          </label>
          {markAsFixedExpense && (
            <p className="text-xs text-muted-foreground">Também será cadastrada em &quot;Custos &gt; Despesas Fixas&quot;, entrando no cálculo de custo indireto de orçamentos futuros até que você a remova de lá.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Conta/Caixa</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Conta padrão">{accounts.find((a) => a.id === accountId)?.name}</SelectValue></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}{a.isDefault ? ' (padrão)' : ''}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Projeto (opcional)</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum">{selectedProject?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fornecedor (opcional)</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum">{selectedSupplier?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cliente (opcional)</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum">{selectedClient?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
