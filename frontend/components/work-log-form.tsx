'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Project, WorkLog, WorkLogInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  initialData?: WorkLog;
  onSubmit: (data: WorkLogInput) => Promise<void>;
  onCancel: () => void;
}

export function WorkLogForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(initialData?.projectId || '');
  const [date, setDate] = useState(initialData?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState(initialData?.weather || '');
  const [workersPresent, setWorkersPresent] = useState(
    initialData?.workersPresent !== undefined ? String(initialData.workersPresent) : '',
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [occurrences, setOccurrences] = useState(initialData?.occurrences || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listProjects(token).then(setProjects); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) { setError('Selecione um projeto.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        projectId,
        date,
        weather: weather || undefined,
        workersPresent: workersPresent ? parseInt(workersPresent) : undefined,
        description,
        occurrences: occurrences || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Projeto</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione...">
              {selectedProject ? `${selectedProject.number} - ${selectedProject.name}` : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Clima</Label>
          <Input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="Ex: Ensolarado" />
        </div>
        <div className="space-y-2">
          <Label>Trabalhadores</Label>
          <Input type="number" min="0" placeholder="0" value={workersPresent} onChange={(e) => setWorkersPresent(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição das Atividades</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
      </div>

      <div className="space-y-2">
        <Label>Ocorrências (opcional)</Label>
        <Textarea value={occurrences} onChange={(e) => setOccurrences(e.target.value)} rows={2} placeholder="Atrasos, imprevistos, acidentes..." />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}