'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CloseVehicleTripInput, VehicleTrip } from '@/lib/api';

interface Props {
  trip: VehicleTrip;
  onSubmit: (data: CloseVehicleTripInput) => Promise<void>;
  onCancel: () => void;
}

export function VehicleTripCloseForm({ trip, onSubmit, onCancel }: Props) {
  const [endKm, setEndKm] = useState(String(trip.startKm ?? 0));
  const [tollCost, setTollCost] = useState('0');
  const [notes, setNotes] = useState(trip.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const distance = Math.max(0, (parseFloat(endKm) || 0) - (trip.startKm ?? 0));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        endKm: parseFloat(endKm) || 0,
        tollCost: parseFloat(tollCost) || 0,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fechar viagem');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {trip.origin} → {trip.destination} · Km inicial: {trip.startKm ?? '-'}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Km Final (odômetro)</Label>
          <Input type="number" step="0.1" min={trip.startKm ?? 0} value={endKm} onChange={(e) => setEndKm(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Pedágio (R$)</Label>
          <Input type="number" step="0.01" min="0" value={tollCost} onChange={(e) => setTollCost(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Distância calculada: <span className="font-mono font-medium">{distance.toFixed(1)} km</span></p>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Fechando...' : 'Fechar Viagem'}</Button>
      </div>
    </form>
  );
}
