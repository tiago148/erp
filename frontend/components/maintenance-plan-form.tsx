'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, MaintenancePlan, MaintenancePlanInput, MaintenanceTargetType, MaintenanceIntervalType, Vehicle, Tool } from '@/lib/api';

interface Props {
  initialData?: MaintenancePlan;
  onSubmit: (data: MaintenancePlanInput) => Promise<void>;
  onCancel: () => void;
}

const targetTypeLabels: Record<MaintenanceTargetType, string> = { VEHICLE: 'Veículo', TOOL: 'Ferramenta' };
const intervalTypeLabels: Record<MaintenanceIntervalType, string> = { KM: 'Por quilometragem', MONTHS: 'Por tempo (meses)' };

function empty(): MaintenancePlanInput {
  return {
    targetType: 'VEHICLE',
    targetId: '',
    targetLabel: '',
    name: '',
    intervalType: 'KM',
    intervalKm: 10000,
    intervalMonths: undefined,
    alertThresholdKm: 1000,
    alertThresholdDays: 15,
    lastServiceDate: '',
    lastServiceKm: undefined,
    notes: '',
  };
}

export function MaintenancePlanForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [form, setForm] = useState<MaintenancePlanInput>(empty());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTargets = useCallback(async () => {
    if (!token) return;
    const [v, t] = await Promise.all([api.listVehicles(token), api.listTools(token)]);
    setVehicles(v);
    setTools(t);
  }, [token]);

  useEffect(() => { loadTargets(); }, [loadTargets]);

  useEffect(() => {
    if (initialData) {
      setForm({
        targetType: initialData.targetType,
        targetId: initialData.targetId,
        targetLabel: initialData.targetLabel,
        name: initialData.name,
        intervalType: initialData.intervalType,
        intervalKm: initialData.intervalKm,
        intervalMonths: initialData.intervalMonths,
        alertThresholdKm: initialData.alertThresholdKm,
        alertThresholdDays: initialData.alertThresholdDays,
        lastServiceDate: initialData.lastServiceDate ? initialData.lastServiceDate.slice(0, 10) : '',
        lastServiceKm: initialData.lastServiceKm,
        notes: initialData.notes ?? '',
      });
    }
  }, [initialData]);

  function set<K extends keyof MaintenancePlanInput>(field: K, value: MaintenancePlanInput[K]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleTargetTypeChange(targetType: MaintenanceTargetType) {
    setForm((p) => ({
      ...p,
      targetType,
      targetId: '',
      targetLabel: '',
      intervalType: targetType === 'TOOL' ? 'MONTHS' : p.intervalType,
    }));
  }

  function handleTargetSelect(id: string | null) {
    if (!id) return;
    const options = form.targetType === 'VEHICLE' ? vehicles : tools;
    const item = options.find((o) => o.id === id);
    if (!item) return;
    set('targetId', id);
    set('targetLabel', item.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        intervalKm: form.intervalType === 'KM' ? form.intervalKm : undefined,
        intervalMonths: form.intervalType === 'MONTHS' ? form.intervalMonths : undefined,
        lastServiceDate: form.lastServiceDate || undefined,
        notes: form.notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const targetOptions = form.targetType === 'VEHICLE' ? vehicles : tools;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Bem</Label>
          <Select value={form.targetType} onValueChange={(v) => handleTargetTypeChange(v as MaintenanceTargetType)}>
            <SelectTrigger className="w-full"><SelectValue>{targetTypeLabels[form.targetType]}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="VEHICLE">Veículo</SelectItem>
              <SelectItem value="TOOL">Ferramenta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{targetTypeLabels[form.targetType]}</Label>
          <Select value={form.targetId} onValueChange={handleTargetSelect}>
            <SelectTrigger className="w-full"><SelectValue>{form.targetLabel || 'Selecione'}</SelectValue></SelectTrigger>
            <SelectContent>
              {targetOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Nome da Revisão</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Troca de óleo, Calibração anual" required />
      </div>

      <div className="space-y-2">
        <Label>Intervalo</Label>
        <Select value={form.intervalType} onValueChange={(v) => set('intervalType', v as MaintenanceIntervalType)}>
          <SelectTrigger className="w-full"><SelectValue>{intervalTypeLabels[form.intervalType]}</SelectValue></SelectTrigger>
          <SelectContent>
            {form.targetType === 'VEHICLE' && <SelectItem value="KM">{intervalTypeLabels.KM}</SelectItem>}
            <SelectItem value="MONTHS">{intervalTypeLabels.MONTHS}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.intervalType === 'KM' ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>A cada quantos km</Label>
            <Input type="number" min="1" step="100" value={form.intervalKm ?? ''} onChange={(e) => set('intervalKm', parseFloat(e.target.value) || 0)} required />
          </div>
          <div className="space-y-2">
            <Label>Avisar faltando (km)</Label>
            <Input type="number" min="0" step="100" value={form.alertThresholdKm ?? ''} onChange={(e) => set('alertThresholdKm', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>A cada quantos meses</Label>
            <Input type="number" min="1" step="1" value={form.intervalMonths ?? ''} onChange={(e) => set('intervalMonths', parseInt(e.target.value) || 0)} required />
          </div>
          <div className="space-y-2">
            <Label>Avisar faltando (dias)</Label>
            <Input type="number" min="0" step="1" value={form.alertThresholdDays ?? ''} onChange={(e) => set('alertThresholdDays', parseInt(e.target.value) || 0)} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Última execução (opcional)</Label>
          <Input type="date" value={form.lastServiceDate ?? ''} onChange={(e) => set('lastServiceDate', e.target.value)} />
        </div>
        {form.intervalType === 'KM' && (
          <div className="space-y-2">
            <Label>Km da última execução (opcional)</Label>
            <Input type="number" min="0" value={form.lastServiceKm ?? ''} onChange={(e) => set('lastServiceKm', parseFloat(e.target.value) || undefined)} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving || !form.targetId}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
