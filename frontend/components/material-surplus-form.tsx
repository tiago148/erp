'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Material, Project, MaterialSurplusInput, SurplusShape, SurplusDestination } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { suggestSurplusDestination } from '@/lib/surplus-classification';

interface Props {
  initialProjectId?: string;
  onSubmit: (data: MaterialSurplusInput) => Promise<void>;
  onCancel: () => void;
}

const shapeLabels: Record<SurplusShape, string> = {
  CHAPA: 'Chapa', BARRA_TUBO: 'Barra/Tubo', FIO: 'Fio', OUTRO: 'Outro',
};
const destinationLabels: Record<SurplusDestination, string> = {
  ESTOQUE: 'Estoque', RETALHO: 'Retalho', SUCATA: 'Sucata',
};
const destinationVariant: Record<SurplusDestination, 'success' | 'warning' | 'danger'> = {
  ESTOQUE: 'success', RETALHO: 'warning', SUCATA: 'danger',
};

export function MaterialSurplusForm({ initialProjectId, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [shape, setShape] = useState<SurplusShape | ''>('');
  const [alloy, setAlloy] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [location, setLocation] = useState('');
  const [destinationOverride, setDestinationOverride] = useState<SurplusDestination | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listProjects(token).then(setProjects);
    api.listMaterials(token).then(setMaterials);
  }, [token]);

  const suggestedDestination = suggestSurplusDestination(
    shape || undefined,
    parseFloat(length) || undefined,
    parseFloat(width) || undefined,
  );
  const effectiveDestination = destinationOverride || suggestedDestination;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !materialId) { setError('Selecione o projeto e o material.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        projectId,
        materialId,
        quantity: parseFloat(quantity) || 0,
        shape: shape || undefined,
        alloy: alloy || undefined,
        length: length ? parseFloat(length) : undefined,
        width: width ? parseFloat(width) : undefined,
        unitValue: unitValue ? parseFloat(unitValue) : undefined,
        location: location || undefined,
        destination: effectiveDestination,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar sobra');
    } finally {
      setSaving(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedMaterial = materials.find((m) => m.id === materialId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Projeto</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{selectedProject ? `${selectedProject.number} - ${selectedProject.name}` : undefined}</SelectValue></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Material</Label>
          <Select value={materialId} onValueChange={setMaterialId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{selectedMaterial ? `${selectedMaterial.name} (${selectedMaterial.unit})` : undefined}</SelectValue></SelectTrigger>
            <SelectContent>
              {materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantidade sobrando</Label>
          <Input type="number" step="0.01" min="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </div>
      </div>

      <div className="border rounded-md p-3 space-y-3">
        <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Medidas (opcional — ajuda a sugerir o destino)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Forma</Label>
            <Select value={shape} onValueChange={(v) => setShape((v || '') as SurplusShape)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Não informado">{shape ? shapeLabels[shape] : undefined}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="CHAPA">{shapeLabels.CHAPA}</SelectItem>
                <SelectItem value="BARRA_TUBO">{shapeLabels.BARRA_TUBO}</SelectItem>
                <SelectItem value="FIO">{shapeLabels.FIO}</SelectItem>
                <SelectItem value="OUTRO">{shapeLabels.OUTRO}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Liga/Material</Label>
            <Input value={alloy} onChange={(e) => setAlloy(e.target.value)} placeholder="Ex: Aço 1020, Alumínio 6063" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Comprimento (cm)</Label>
            <Input type="number" step="0.1" min="0" value={length} onChange={(e) => setLength(e.target.value)} />
          </div>
          {shape === 'CHAPA' && (
            <div className="space-y-2">
              <Label>Largura (cm)</Label>
              <Input type="number" step="0.1" min="0" value={width} onChange={(e) => setWidth(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Valor unitário estimado (R$)</Label>
            <Input type="number" step="0.01" min="0" value={unitValue} onChange={(e) => setUnitValue(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Local de guarda</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Prateleira A3, Container 2" />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm">Destino sugerido</span>
          <div className="flex items-center gap-2">
            <Badge variant={destinationVariant[effectiveDestination]}>{destinationLabels[effectiveDestination]}</Badge>
            <Select value={destinationOverride} onValueChange={(v) => setDestinationOverride((v || '') as SurplusDestination)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Usar sugestão">{destinationOverride ? destinationLabels[destinationOverride] : undefined}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="ESTOQUE">{destinationLabels.ESTOQUE}</SelectItem>
                <SelectItem value="RETALHO">{destinationLabels.RETALHO}</SelectItem>
                <SelectItem value="SUCATA">{destinationLabels.SUCATA}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Registrar Sobra'}</Button>
      </div>
    </form>
  );
}
