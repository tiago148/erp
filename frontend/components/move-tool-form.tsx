'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Project, Tool, MoveToolInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  tool: Tool;
  onSubmit: (data: MoveToolInput) => Promise<void>;
  onCancel: () => void;
}

export function MoveToolForm({ tool, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [toLocation, setToLocation] = useState<'COMPANY' | 'PROJECT'>(
    tool.currentLocation === 'COMPANY' ? 'PROJECT' : 'COMPANY',
  );
  const [projectId, setProjectId] = useState('');
  const [responsible, setResponsible] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listProjects(token).then(setProjects); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (toLocation === 'PROJECT' && !projectId) {
      setError('Selecione o projeto de destino.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({ toLocation, projectId: toLocation === 'PROJECT' ? projectId : undefined, responsible, notes });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover ferramenta');
    } finally {
      setSaving(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">
        Local atual: <span className="font-medium">{tool.currentLocation === 'COMPANY' ? 'Empresa' : tool.currentProject?.name}</span>
      </p>

      <div className="space-y-2">
        <Label>Mover para</Label>
        <Select value={toLocation} onValueChange={(v) => setToLocation(v as 'COMPANY' | 'PROJECT')}>
          <SelectTrigger><SelectValue>{toLocation === 'COMPANY' ? 'Empresa' : 'Projeto'}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="COMPANY">Empresa</SelectItem>
            <SelectItem value="PROJECT">Projeto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {toLocation === 'PROJECT' && (
        <div className="space-y-2">
          <Label>Projeto de Destino</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger><SelectValue placeholder="Selecione...">{selectedProject?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Responsável (quem levou/retirou)</Label>
        <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Movendo...' : 'Confirmar Movimentação'}</Button>
      </div>
    </form>
  );
}