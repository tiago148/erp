'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, LessonLearnedInput, Project, Employee } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  onSubmit: (data: LessonLearnedInput) => Promise<void>;
  onCancel: () => void;
}

export const lessonCategoryLabels: Record<string, string> = {
  orcamento: 'Erro de orçamento', execucao: 'Erro de execução', material: 'Problema de material',
  prazo: 'Atraso de prazo', cliente: 'Comunicação com cliente', fornecedor: 'Fornecedor',
  seguranca: 'Segurança', acerto: 'Acerto — deu certo, repetir',
};

export function LessonLearnedForm({ onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState('execucao');
  const [whatHappened, setWhatHappened] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [hoursLost, setHoursLost] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState('');
  const [becameProcedure, setBecameProcedure] = useState('nao');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listProjects(token).then(setProjects);
    api.listEmployees(token).then(setEmployees);
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!whatHappened.trim() || !actionTaken.trim()) {
      setError('Preencha o que aconteceu e a ação definida.');
      return;
    }
    setError('');
    setSaving(true);
    const project = projects.find((p) => p.id === projectId);
    const responsible = employees.find((e) => e.id === responsibleEmployeeId);
    try {
      await onSubmit({
        date,
        projectId: projectId || undefined,
        projectLabel: project ? `${project.number} - ${project.name}` : undefined,
        category,
        whatHappened,
        rootCause: rootCause || undefined,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        hoursLost: hoursLost ? parseFloat(hoursLost) : undefined,
        actionTaken,
        responsibleEmployeeId: responsibleEmployeeId || undefined,
        responsibleLabel: responsible?.name,
        becameProcedure: becameProcedure === 'sim',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar lição aprendida');
    } finally {
      setSaving(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedResponsible = employees.find((e) => e.id === responsibleEmployeeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Projeto</Label>
          <Select value={projectId} onValueChange={(v) => setProjectId(v || '')}>
            <SelectTrigger className="w-full"><SelectValue placeholder="— Geral —">{selectedProject?.number}</SelectValue></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={category} onValueChange={(v) => setCategory(v || 'execucao')}>
            <SelectTrigger className="w-full"><SelectValue>{lessonCategoryLabels[category]}</SelectValue></SelectTrigger>
            <SelectContent>
              {Object.entries(lessonCategoryLabels).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>O que aconteceu</Label>
        <Textarea value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)} placeholder="Fato, sem julgamento de pessoa" required />
      </div>

      <div className="space-y-2">
        <Label>Por que aconteceu (causa raiz)</Label>
        <Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="Pergunte por quê até chegar no processo, não na pessoa" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Custo estimado (R$)</Label>
          <Input type="number" step="0.01" min="0" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Horas perdidas</Label>
          <Input type="number" step="0.5" min="0" value={hoursLost} onChange={(e) => setHoursLost(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Ação para não repetir</Label>
        <Textarea value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="O que muda no processo a partir de agora" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Responsável pela ação</Label>
          <Select value={responsibleEmployeeId} onValueChange={(v) => setResponsibleEmployeeId(v || '')}>
            <SelectTrigger className="w-full"><SelectValue placeholder="— Selecione —">{selectedResponsible?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {employees.map((emp) => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Virou procedimento?</Label>
          <Select value={becameProcedure} onValueChange={(v) => setBecameProcedure(v || 'nao')}>
            <SelectTrigger className="w-full"><SelectValue>{becameProcedure === 'sim' ? 'Sim, já documentado' : 'Ainda não'}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="nao">Ainda não</SelectItem>
              <SelectItem value="sim">Sim, já documentado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Registrar Lição'}</Button>
      </div>
    </form>
  );
}
