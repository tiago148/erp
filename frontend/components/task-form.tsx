'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Project, Task, TaskInput, TaskPriority } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  initialData?: Task;
  onSubmit: (data: TaskInput) => Promise<void>;
  onCancel: () => void;
}

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
};

export function TaskForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(initialData?.dueDate?.slice(0, 10) || '');
  const [dueTime, setDueTime] = useState(() => {
    if (!initialData?.dueDate) return '';
    const d = new Date(initialData.dueDate);
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) return '';
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  });
  const [projectId, setProjectId] = useState(initialData?.projectId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listProjects(token).then(setProjects); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const dueDateTime = dueDate
        ? (dueTime ? `${dueDate}T${dueTime}:00.000Z` : dueDate)
        : undefined;
      await onSubmit({
        title,
        description: description || undefined,
        priority,
        dueDate: dueDateTime,
        projectId: projectId || undefined,
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
        <Label>Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
            <SelectTrigger><SelectValue>{priorityLabels[priority]}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Baixa</SelectItem>
              <SelectItem value="MEDIUM">Média</SelectItem>
              <SelectItem value="HIGH">Alta</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Prazo (opcional)</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Horário (opcional)</Label>
          <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} disabled={!dueDate} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Projeto vinculado (opcional)</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger><SelectValue placeholder="Nenhum">{selectedProject?.name}</SelectValue></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}