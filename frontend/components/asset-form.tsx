'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Asset, AssetInput } from '@/lib/api';

interface AssetFormProps {
  initialData?: Asset;
  onSubmit: (data: AssetInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: AssetInput = {
  name: '',
  category: '',
  acquisitionValue: 0,
  acquisitionDate: new Date().toISOString().slice(0, 10),
  usefulLifeMonths: 60,
  residualValue: 0,
  notes: '',
};

export function AssetForm({ initialData, onSubmit, onCancel }: AssetFormProps) {
  const [form, setForm] = useState<AssetInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        category: initialData.category || '',
        acquisitionValue: initialData.acquisitionValue,
        acquisitionDate: initialData.acquisitionDate.slice(0, 10),
        usefulLifeMonths: initialData.usefulLifeMonths,
        residualValue: initialData.residualValue,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  function updateField<K extends keyof AssetInput>(field: K, value: AssetInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar patrimônio');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Bem</Label>
          <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ex: Caminhão Munck, Betoneira" required />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input value={form.category} onChange={(e) => updateField('category', e.target.value)} placeholder="Ex: Veículo, Ferramenta, Equipamento" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor de Aquisição (R$)</Label>
          <Input type="number" step="0.01" min="0" value={form.acquisitionValue} onChange={(e) => updateField('acquisitionValue', parseFloat(e.target.value) || 0)} required />
        </div>
        <div className="space-y-2">
          <Label>Data de Aquisição</Label>
          <Input type="date" value={form.acquisitionDate} onChange={(e) => updateField('acquisitionDate', e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vida Útil (meses)</Label>
          <Input type="number" min="1" value={form.usefulLifeMonths} onChange={(e) => updateField('usefulLifeMonths', parseInt(e.target.value) || 1)} required />
        </div>
        <div className="space-y-2">
          <Label>Valor Residual (R$)</Label>
          <Input type="number" step="0.01" min="0" value={form.residualValue} onChange={(e) => updateField('residualValue', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
