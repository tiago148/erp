'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Material, Project, MaterialSurplusInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  onSubmit: (data: MaterialSurplusInput) => Promise<void>;
  onCancel: () => void;
}

export function MaterialSurplusForm({ onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projectId, setProjectId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listProjects(token).then(setProjects);
    api.listMaterials(token).then(setMaterials);
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !materialId) { setError('Selecione o projeto e o material.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({ projectId, materialId, quantity: parseFloat(quantity) || 0, notes: notes || undefined });
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
