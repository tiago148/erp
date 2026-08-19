'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceAccount, FinanceAccountInput, FinanceAccountType } from '@/lib/api';

interface Props {
  initialData?: FinanceAccount;
  onSubmit: (data: FinanceAccountInput) => Promise<void>;
  onCancel: () => void;
}

const typeLabels: Record<FinanceAccountType, string> = { CAIXA: 'Caixa', BANCO: 'Banco' };

const empty: FinanceAccountInput = { name: '', type: 'CAIXA', initialBalance: 0, isDefault: false, active: true };

export function FinanceAccountForm({ initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FinanceAccountInput>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        type: initialData.type,
        initialBalance: initialData.initialBalance,
        isDefault: initialData.isDefault,
        active: initialData.active,
      });
    }
  }, [initialData]);

  function set<K extends keyof FinanceAccountInput>(field: K, value: FinanceAccountInput[K]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Caixa Físico, Banco Itaú" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={(v) => set('type', v as FinanceAccountType)}>
            <SelectTrigger className="w-full"><SelectValue>{typeLabels[form.type || 'CAIXA']}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="CAIXA">{typeLabels.CAIXA}</SelectItem>
              <SelectItem value="BANCO">{typeLabels.BANCO}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Saldo inicial (R$)</Label>
          <Input type="number" step="0.01" value={form.initialBalance ?? 0} onChange={(e) => set('initialBalance', parseFloat(e.target.value) || 0)} disabled={!!initialData} />
          {initialData && <p className="text-xs text-muted-foreground">O saldo inicial só é usado para o primeiro fechamento desta conta e não pode ser editado depois.</p>}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4" checked={!!form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
        Definir como conta padrão (usada quando nenhuma conta é escolhida em um lançamento)
      </label>
      {initialData && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={!!form.active} onChange={(e) => set('active', e.target.checked)} />
          Conta ativa
        </label>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
