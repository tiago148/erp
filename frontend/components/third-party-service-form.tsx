'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThirdPartyService, ThirdPartyServiceInput } from '@/lib/api';

interface ThirdPartyServiceFormProps {
  initialData?: ThirdPartyService;
  onSubmit: (data: ThirdPartyServiceInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: ThirdPartyServiceInput = {
  name: '',
  category: '',
  unit: '',
  unitPrice: 0,
  supplier: '',
  leadTimeDays: undefined,
  active: true,
};

export function ThirdPartyServiceForm({ initialData, onSubmit, onCancel }: ThirdPartyServiceFormProps) {
  const [form, setForm] = useState<ThirdPartyServiceInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        category: initialData.category,
        unit: initialData.unit,
        unitPrice: initialData.unitPrice,
        supplier: initialData.supplier || '',
        leadTimeDays: initialData.leadTimeDays,
        active: initialData.active,
      });
    }
  }, [initialData]);

  function updateField<K extends keyof ThirdPartyServiceInput>(field: K, value: ThirdPartyServiceInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar serviço');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Serviço</Label>
          <Input
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ex: Usinagem, Jateamento, Galvanização"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Unidade (ex: un, m², h)</Label>
          <Input
            value={form.unit}
            onChange={(e) => updateField('unit', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Preço Unitário (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.unitPrice}
            onChange={(e) => updateField('unitPrice', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fornecedor</Label>
          <Input
            value={form.supplier}
            onChange={(e) => updateField('supplier', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Prazo de Entrega (dias)</Label>
          <Input
            type="number"
            step="1"
            min="0"
            value={form.leadTimeDays ?? ''}
            onChange={(e) => updateField('leadTimeDays', e.target.value ? parseInt(e.target.value, 10) : undefined)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
