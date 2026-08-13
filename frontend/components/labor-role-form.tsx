'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LaborRole, LaborRoleInput } from '@/lib/api';

interface LaborRoleFormProps {
  initialData?: LaborRole;
  onSubmit: (data: LaborRoleInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: LaborRoleInput = {
  name: '',
  hourlyRate: 0,
  chargesPct: 0,
};

export function LaborRoleForm({ initialData, onSubmit, onCancel }: LaborRoleFormProps) {
  const [form, setForm] = useState<LaborRoleInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        hourlyRate: initialData.hourlyRate,
        chargesPct: initialData.chargesPct,
      });
    }
  }, [initialData]);

  function updateField<K extends keyof LaborRoleInput>(field: K, value: LaborRoleInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar função');
    } finally {
      setIsSubmitting(false);
    }
  }

  const preview = form.hourlyRate * (1 + (form.chargesPct || 0) / 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Função</Label>
        <Input
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Ex: Soldador, Ajudante, Encarregado"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Taxa/Hora (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.hourlyRate}
            onChange={(e) => updateField('hourlyRate', parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Encargos (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.chargesPct}
            onChange={(e) => updateField('chargesPct', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="rounded-md bg-muted p-3 text-sm">
        <span className="text-muted-foreground">Taxa/hora com encargos: </span>
        <span className="font-semibold">
          {preview.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
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