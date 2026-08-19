'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceAccount, TransferFinanceEntryInput } from '@/lib/api';

interface Props {
  accounts: FinanceAccount[];
  onSubmit: (data: TransferFinanceEntryInput) => Promise<void>;
  onCancel: () => void;
}

export function FinanceTransferForm({ accounts, onSubmit, onCancel }: Props) {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) { setError('Selecione a conta de origem e a de destino.'); return; }
    if (fromAccountId === toAccountId) { setError('A conta de origem e destino devem ser diferentes.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        fromAccountId,
        toAccountId,
        amount: parseFloat(amount) || 0,
        description: description || 'Transferência entre contas',
        date,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar transferência');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-muted-foreground">Transferências entre contas próprias não entram como receita ou despesa no fechamento — apenas movem o saldo de uma conta para outra.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Conta de origem</Label>
          <Select value={fromAccountId} onValueChange={setFromAccountId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{fromAccount?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Conta de destino</Label>
          <Select value={toAccountId} onValueChange={setToAccountId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{toAccount?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {accounts.filter((a) => a.id !== fromAccountId).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Reforço de caixa" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Transferindo...' : 'Transferir'}</Button>
      </div>
    </form>
  );
}
