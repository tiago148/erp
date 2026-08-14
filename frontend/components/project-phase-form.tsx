'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProjectPhase, ProjectPhaseInput } from '@/lib/api';

interface Props {
  projectId: string;
  initialData?: ProjectPhase;
  onSubmit: (data: ProjectPhaseInput) => Promise<void>;
  onCancel: () => void;
}

function empty(projectId: string): ProjectPhaseInput {
  return {
    projectId,
    name: '',
    weightPct: 0,
    plannedStart: '',
    plannedEnd: '',
    progressPct: 0,
    measuredAt: '',
    notes: '',
  };
}

export function ProjectPhaseForm({ projectId, initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ProjectPhaseInput>(empty(projectId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        projectId: initialData.projectId,
        name: initialData.name,
        weightPct: initialData.weightPct,
        plannedStart: initialData.plannedStart.slice(0, 10),
        plannedEnd: initialData.plannedEnd.slice(0, 10),
        progressPct: initialData.progressPct,
        measuredAt: initialData.measuredAt ? initialData.measuredAt.slice(0, 10) : '',
        notes: initialData.notes ?? '',
      });
    }
  }, [initialData]);

  function set<K extends keyof ProjectPhaseInput>(field: K, value: ProjectPhaseInput[K]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        measuredAt: form.measuredAt || undefined,
        notes: form.notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da etapa</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Fundação, Alvenaria, Acabamento" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Peso no total da obra (%)</Label>
          <Input type="number" step="0.1" min="0" max="100" value={form.weightPct} onChange={(e) => set('weightPct', Number(e.target.value))} required />
        </div>
        <div className="space-y-2">
          <Label>Avanço físico medido (%)</Label>
          <Input type="number" step="0.1" min="0" max="100" value={form.progressPct ?? 0} onChange={(e) => set('progressPct', Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Início planejado</Label>
          <Input type="date" value={form.plannedStart} onChange={(e) => set('plannedStart', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Fim planejado</Label>
          <Input type="date" value={form.plannedEnd} onChange={(e) => set('plannedEnd', e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Data da última medição (opcional)</Label>
        <Input type="date" value={form.measuredAt ?? ''} onChange={(e) => set('measuredAt', e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
