'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RentalEquipment, RentalEquipmentInput, RentalBillingUnit } from '@/lib/api';

interface RentalEquipmentFormProps {
  initialData?: RentalEquipment;
  onSubmit: (data: RentalEquipmentInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: RentalEquipmentInput = {
  name: '',
  category: '',
  billingUnit: 'DAY',
  unitPrice: 0,
  mobilizationCost: 0,
  minimumPeriod: 1,
  supplier: '',
  active: true,
};

const billingUnitLabels: Record<RentalBillingUnit, string> = {
  HOUR: 'Por hora',
  DAY: 'Por dia',
  WEEK: 'Por semana',
  MONTH: 'Por mês',
  EVENT: 'Por evento',
};

export function RentalEquipmentForm({ initialData, onSubmit, onCancel }: RentalEquipmentFormProps) {
  const [form, setForm] = useState<RentalEquipmentInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        category: initialData.category,
        billingUnit: initialData.billingUnit,
        unitPrice: initialData.unitPrice,
        mobilizationCost: initialData.mobilizationCost,
        minimumPeriod: initialData.minimumPeriod,
        supplier: initialData.supplier || '',
        active: initialData.active,
      });
    }
  }, [initialData]);

  function updateField<K extends keyof RentalEquipmentInput>(field: K, value: RentalEquipmentInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar equipamento');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Equipamento</Label>
          <Input
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ex: Andaime, Plataforma, Guindaste"
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
          <Label>Unidade de Cobrança</Label>
          <Select value={form.billingUnit} onValueChange={(v) => updateField('billingUnit', v as RentalBillingUnit)}>
            <SelectTrigger className="w-full">
              <SelectValue>{billingUnitLabels[form.billingUnit || 'DAY']}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(billingUnitLabels) as RentalBillingUnit[]).map((u) => (
                <SelectItem key={u} value={u}>{billingUnitLabels[u]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Preço por Período (R$)</Label>
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
          <Label>Custo de Mobilização (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.mobilizationCost}
            onChange={(e) => updateField('mobilizationCost', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label>Período Mínimo</Label>
          <Input
            type="number"
            step="1"
            min="1"
            value={form.minimumPeriod}
            onChange={(e) => updateField('minimumPeriod', parseInt(e.target.value, 10) || 1)}
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
