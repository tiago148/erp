'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vehicle, VehicleInput } from '@/lib/api';

interface VehicleFormProps {
  initialData?: Vehicle;
  onSubmit: (data: VehicleInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: VehicleInput = {
  name: '',
  plate: '',
  type: '',
  fuelType: '',
  avgConsumption: 0,
};

export function VehicleForm({ initialData, onSubmit, onCancel }: VehicleFormProps) {
  const [form, setForm] = useState<VehicleInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        plate: initialData.plate,
        type: initialData.type,
        fuelType: initialData.fuelType,
        avgConsumption: initialData.avgConsumption,
      });
    }
  }, [initialData]);

  function updateField<K extends keyof VehicleInput>(field: K, value: VehicleInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar veículo');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Veículo</Label>
          <Input
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ex: Van Sprinter"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Placa</Label>
          <Input
            value={form.plate}
            onChange={(e) => updateField('plate', e.target.value.toUpperCase())}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Input
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
            placeholder="Ex: Van, Caminhão, Utilitário"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Combustível</Label>
          <Input
            value={form.fuelType}
            onChange={(e) => updateField('fuelType', e.target.value)}
            placeholder="Ex: Diesel, Gasolina, Flex"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Consumo Médio (km/l)</Label>
        <Input
          type="number"
          step="0.1"
          min="0.1"
          value={form.avgConsumption}
          onChange={(e) => updateField('avgConsumption', parseFloat(e.target.value) || 0)}
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

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