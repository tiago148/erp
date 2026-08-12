'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Employee, Project, VehicleTripInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  vehicleId: string;
  onSubmit: (data: VehicleTripInput) => Promise<void>;
  onCancel: () => void;
}

export function VehicleTripForm({ vehicleId, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [driverId, setDriverId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listEmployees(token).then(setEmployees);
    api.listProjects(token).then(setProjects);
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        vehicleId,
        driverId: driverId || undefined,
        projectId: projectId || undefined,
        origin,
        destination,
        purpose: purpose || undefined,
        distanceKm: parseFloat(distanceKm) || 0,
        date,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar movimentação');
    } finally {
      setSaving(false);
    }
  }

  const selectedDriver = employees.find((e) => e.id === driverId);
  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Origem</Label>
          <Input value={origin} onChange={(e) => setOrigin(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Destino</Label>
          <Input value={destination} onChange={(e) => setDestination(e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quilometragem (km)</Label>
          <Input type="number" step="0.1" min="0.1" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Motorista (opcional)</Label>
          <Select value={driverId} onValueChange={setDriverId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum">{selectedDriver?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Projeto/Obra (opcional)</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum">{selectedProject?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Finalidade</Label>
        <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Ex: Entrega de material, transporte de equipe" />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Registrar Movimentação'}</Button>
      </div>
    </form>
  );
}
