'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FixedExpense, FixedExpenseInput, FixedExpenseType } from '@/lib/api';

interface Props {
  initialData?: FixedExpense;
  onSubmit: (data: FixedExpenseInput) => Promise<void>;
  onCancel: () => void;
}

const typeLabels: Record<FixedExpenseType, string> = { FIXED: 'Fixo (todo mês igual)', SEMI_VARIABLE: 'Semivariável (média)' };

const categoryOptions = [
  'Instalações (aluguel, IPTU, condomínio)',
  'Pessoal Administrativo',
  'Pró-labore / Sócios',
  'Serviços Contábeis e Jurídicos',
  'Utilidades (luz, água, internet)',
  'Software e Sistemas',
  'Seguros',
  'Veículo Administrativo',
  'Marketing e Comercial',
  'Impostos Fixos',
  'Depreciação de Equipamentos',
  'Outros',
];

const empty: FixedExpenseInput = {
  description: '',
  category: categoryOptions[0],
  amount: 0,
  type: 'FIXED',
  generatesBill: false,
};

export function FixedExpenseForm({ initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FixedExpenseInput>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        description: initialData.description,
        category: initialData.category,
        amount: initialData.amount,
        type: initialData.type,
        generatesBill: initialData.generatesBill,
        billDay: initialData.billDay,
        supplierName: initialData.supplierName,
        notes: initialData.notes,
      });
    }
  }, [initialData]);

  function set<K extends keyof FixedExpenseInput>(field: K, value: FixedExpenseInput[K]) {
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
        <Label>Descrição</Label>
        <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Ex: Aluguel do galpão, Contador, Pró-labore" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={form.category} onValueChange={(v) => set('category', v)}>
            <SelectTrigger className="w-full"><SelectValue>{form.category}</SelectValue></SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor mensal (R$)</Label>
          <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set('amount', Number(e.target.value))} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={form.type} onValueChange={(v) => set('type', v as FixedExpenseType)}>
          <SelectTrigger className="w-full"><SelectValue>{typeLabels[form.type]}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="FIXED">{typeLabels.FIXED}</SelectItem>
            <SelectItem value="SEMI_VARIABLE">{typeLabels.SEMI_VARIABLE}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.generatesBill}
          onChange={(e) => set('generatesBill', e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Gerar conta a pagar mensal automaticamente
      </label>
      {form.generatesBill && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Dia do vencimento</Label>
            <Input type="number" min="1" max="28" value={form.billDay ?? ''} onChange={(e) => set('billDay', Number(e.target.value))} required={form.generatesBill} />
          </div>
          <div className="space-y-2">
            <Label>Fornecedor / Credor</Label>
            <Input value={form.supplierName ?? ''} onChange={(e) => set('supplierName', e.target.value)} />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
