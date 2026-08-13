'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Material, MaterialInput } from '@/lib/api';

interface MaterialFormProps {
  initialData?: Material;
  onSubmit: (data: MaterialInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: MaterialInput = {
  code: '',
  name: '',
  category: '',
  unit: '',
  unitCost: 0,
  supplier: '',
};

export function MaterialForm({ initialData, onSubmit, onCancel }: MaterialFormProps) {
  const [form, setForm] = useState<MaterialInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        code: initialData.code || '',
        name: initialData.name,
        category: initialData.category,
        unit: initialData.unit,
        unitCost: initialData.unitCost,
        supplier: initialData.supplier || '',
      });
    }
  }, [initialData]);

  function updateField<K extends keyof MaterialInput>(field: K, value: MaterialInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar material');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Código</Label>
          <Input
            value={form.code}
            onChange={(e) => updateField('code', e.target.value)}
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

      <div className="space-y-2">
        <Label>Nome do Material</Label>
        <Input
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Unidade (ex: m2, kg, un)</Label>
          <Input
            value={form.unit}
            onChange={(e) => updateField('unit', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Custo Unitário (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.unitCost}
            onChange={(e) => updateField('unitCost', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fornecedor</Label>
        <Input
          value={form.supplier}
          onChange={(e) => updateField('supplier', e.target.value)}
        />
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