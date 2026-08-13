'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VehicleMaintenance, VehicleMaintenanceInput } from '@/lib/api';

interface Props {
  vehicleId: string;
  initialData?: VehicleMaintenance;
  onSubmit: (data: VehicleMaintenanceInput) => Promise<void>;
  onCancel: () => void;
}

export function VehicleMaintenanceForm({ vehicleId, initialData, onSubmit, onCancel }: Props) {
  const [date, setDate] = useState(initialData?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [km, setKm] = useState(initialData ? String(initialData.km) : '');
  const [type, setType] = useState(initialData?.type || '');
  const [cost, setCost] = useState(initialData ? String(initialData.cost) : '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [supplierName, setSupplierName] = useState(initialData?.supplierName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        vehicleId,
        date,
        km: parseFloat(km) || 0,
        type,
        cost: parseFloat(cost) || 0,
        description: description || undefined,
        supplierName: supplierName || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar manutenção');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>KM do veículo</Label>
          <Input type="number" step="1" min="0" value={km} onChange={(e) => setKm(e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Ex: Revisão, Troca de óleo, Pneu" required />
        </div>
        <div className="space-y-2">
          <Label>Custo (R$)</Label>
          <Input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fornecedor/Oficina</Label>
        <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>

      <p className="text-xs text-muted-foreground">Se o custo for maior que zero, uma conta a pagar é gerada automaticamente no Financeiro.</p>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
