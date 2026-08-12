'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Client, WorkSite, Budget, Project, ProjectInput, Employee } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  initialData?: Project;
  onSubmit: (data: ProjectInput) => Promise<void>;
  onCancel: () => void;
}

const statusOptions = [
  { value: 'PLANNING', label: 'Planejamento' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'ON_HOLD', label: 'Pausado' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export function ProjectForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [workSites, setWorkSites] = useState<WorkSite[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [approvedBudgets, setApprovedBudgets] = useState<Budget[]>([]);
  const [origin, setOrigin] = useState<'direct' | 'budget'>(initialData?.budgetId ? 'budget' : 'direct');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(initialData?.name || '');
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [workSiteId, setWorkSiteId] = useState(initialData?.workSiteId || '');
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState(initialData?.responsibleEmployeeId || '');
  const [budgetId, setBudgetId] = useState(initialData?.budgetId || '');
  const [status, setStatus] = useState(initialData?.status || 'PLANNING');
  const [budgetAmount, setBudgetAmount] = useState(initialData?.budgetAmount ?? 0);
  const [startDate, setStartDate] = useState(initialData?.startDate?.slice(0, 10) || '');
  const [endDate, setEndDate] = useState(initialData?.endDate?.slice(0, 10) || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  useEffect(() => {
    if (!token) return;
    api.listClients(token).then(setClients);
    api.listWorkSites(token).then(setWorkSites);
    api.listEmployees(token).then(setEmployees);
    api.listBudgets(token).then((all) => setApprovedBudgets(all.filter((b) => b.status === 'APPROVED')));
  }, [token]);

  function handleBudgetSelect(id: string) {
    setBudgetId(id);
    const b = approvedBudgets.find((x) => x.id === id);
    if (b) {
      setClientId(b.clientId);
      setBudgetAmount(b.totals.total);
      if (!name) setName(`Projeto - Orçamento ${b.number}`);
      if (b.employeeId) setResponsibleEmployeeId(b.employeeId);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) { setError('Selecione um cliente.'); return; }
    setError('');
    setSaving(true);

    const data: ProjectInput = {
      name,
      clientId,
      workSiteId: workSiteId || undefined,
      budgetId: origin === 'budget' ? budgetId || undefined : undefined,
      status,
      budgetAmount,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      notes,
      responsibleEmployeeId: responsibleEmployeeId || undefined,
    };

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar projeto');
    } finally {
      setSaving(false);
    }
  }

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedSite = workSites.find((w) => w.id === workSiteId);
  const selectedBudget = approvedBudgets.find((b) => b.id === budgetId);
  const selectedEmployee = employees.find((e) => e.id === responsibleEmployeeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initialData && (
        <div className="flex gap-2">
          <Button type="button" variant={origin === 'direct' ? 'default' : 'outline'} onClick={() => setOrigin('direct')}>
            Criar Direto
          </Button>
          <Button type="button" variant={origin === 'budget' ? 'default' : 'outline'} onClick={() => setOrigin('budget')}>
            A partir de Orçamento Aprovado
          </Button>
        </div>
      )}

      {origin === 'budget' && !initialData && (
        <div className="space-y-2">
          <Label>Orçamento Aprovado</Label>
          <Select value={budgetId} onValueChange={handleBudgetSelect}>
            <SelectTrigger><SelectValue placeholder="Selecione...">{selectedBudget ? `${selectedBudget.number} - ${selectedBudget.client.name}` : undefined}</SelectValue></SelectTrigger>
            <SelectContent>
              {approvedBudgets.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.number} - {b.client.name} ({fmt(b.totals.total)})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {approvedBudgets.length === 0 && (
            <p className="text-xs text-amber-600">Nenhum orçamento com status "Aprovado" encontrado.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Nome do Projeto</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={clientId} onValueChange={setClientId} disabled={origin === 'budget' && !!budgetId}>
            <SelectTrigger><SelectValue placeholder="Selecione...">{selectedClient?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Local de Obra</Label>
          <Select value={workSiteId} onValueChange={setWorkSiteId}>
            <SelectTrigger><SelectValue placeholder="Selecione...">{selectedSite?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {workSites.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Funcionário Responsável (opcional)</Label>
        <Select value={responsibleEmployeeId} onValueChange={setResponsibleEmployeeId}>
          <SelectTrigger><SelectValue placeholder="Nenhum">{selectedEmployee?.name}</SelectValue></SelectTrigger>
          <SelectContent>
            {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger><SelectValue>{statusOptions.find((s) => s.value === status)?.label}</SelectValue></SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor Orçado (R$)</Label>
          <Input type="number" step="0.01" value={budgetAmount}
            onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
            disabled={origin === 'budget' && !!budgetId} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Data de Término (previsão)</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}