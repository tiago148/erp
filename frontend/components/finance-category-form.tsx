'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceCategory, FinanceCategoryInput, FinanceEntryType } from '@/lib/api';

interface Props {
  initialData?: FinanceCategory;
  onSubmit: (data: FinanceCategoryInput) => Promise<void>;
  onCancel: () => void;
}

const typeLabels: Record<FinanceEntryType, string> = { INCOME: 'Receita', EXPENSE: 'Despesa' };

const empty: FinanceCategoryInput = { name: '', type: 'EXPENSE' };

export function FinanceCategoryForm({ initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FinanceCategoryInput>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({ name: initialData.name, type: initialData.type });
    }
  }, [initialData]);

  function set<K extends keyof FinanceCategoryInput>(field: K, value: FinanceCategoryInput[K]) {
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
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={form.type} onValueChange={(v) => set('type', v as FinanceEntryType)}>
          <SelectTrigger className="w-full"><SelectValue>{typeLabels[form.type]}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="INCOME">Receita</SelectItem>
            <SelectItem value="EXPENSE">Despesa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
