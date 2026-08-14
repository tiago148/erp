'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, TrackedDocument, TrackedDocumentInput, DocumentTargetType, Vehicle, Employee, Tool } from '@/lib/api';

interface Props {
  initialData?: TrackedDocument;
  onSubmit: (data: TrackedDocumentInput) => Promise<void>;
  onCancel: () => void;
}

const targetTypeLabels: Record<DocumentTargetType, string> = {
  VEHICLE: 'Veículo',
  EMPLOYEE: 'Funcionário',
  TOOL: 'Ferramenta',
  COMPANY: 'Empresa',
};

const titlePlaceholders: Record<DocumentTargetType, string> = {
  VEHICLE: 'Ex: CRLV, Seguro, Licenciamento',
  EMPLOYEE: 'Ex: ASO, CNH, NR-35',
  TOOL: 'Ex: Certificado de Calibração',
  COMPANY: 'Ex: Alvará de Funcionamento, Certidão Negativa',
};

function empty(): TrackedDocumentInput {
  return {
    targetType: 'VEHICLE',
    targetId: undefined,
    targetLabel: '',
    title: '',
    documentNumber: '',
    issueDate: '',
    expiresAt: '',
    notes: '',
  };
}

export function DocumentForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [form, setForm] = useState<TrackedDocumentInput>(empty());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTargets = useCallback(async () => {
    if (!token) return;
    const [v, e, t] = await Promise.all([
      api.listVehicles(token),
      api.listEmployees(token),
      api.listTools(token),
    ]);
    setVehicles(v);
    setEmployees(e);
    setTools(t);
  }, [token]);

  useEffect(() => { loadTargets(); }, [loadTargets]);

  useEffect(() => {
    if (initialData) {
      setForm({
        targetType: initialData.targetType,
        targetId: initialData.targetId,
        targetLabel: initialData.targetLabel,
        title: initialData.title,
        documentNumber: initialData.documentNumber ?? '',
        issueDate: initialData.issueDate ? initialData.issueDate.slice(0, 10) : '',
        expiresAt: initialData.expiresAt.slice(0, 10),
        notes: initialData.notes ?? '',
      });
    }
  }, [initialData]);

  function set<K extends keyof TrackedDocumentInput>(field: K, value: TrackedDocumentInput[K]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleTargetTypeChange(targetType: DocumentTargetType) {
    if (targetType === 'COMPANY') {
      setForm((p) => ({ ...p, targetType, targetId: undefined, targetLabel: 'Empresa' }));
    } else {
      setForm((p) => ({ ...p, targetType, targetId: undefined, targetLabel: '' }));
    }
  }

  function handleTargetSelect(id: string | null) {
    if (!id) return;
    const options = form.targetType === 'VEHICLE' ? vehicles : form.targetType === 'EMPLOYEE' ? employees : tools;
    const item = options.find((o) => o.id === id);
    if (!item) return;
    set('targetId', id);
    set('targetLabel', 'name' in item ? item.name : id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        documentNumber: form.documentNumber || undefined,
        issueDate: form.issueDate || undefined,
        notes: form.notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const targetOptions = form.targetType === 'VEHICLE' ? vehicles : form.targetType === 'EMPLOYEE' ? employees : form.targetType === 'TOOL' ? tools : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vinculado a</Label>
          <Select value={form.targetType} onValueChange={(v) => handleTargetTypeChange(v as DocumentTargetType)}>
            <SelectTrigger className="w-full"><SelectValue>{targetTypeLabels[form.targetType]}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="VEHICLE">Veículo</SelectItem>
              <SelectItem value="EMPLOYEE">Funcionário</SelectItem>
              <SelectItem value="TOOL">Ferramenta</SelectItem>
              <SelectItem value="COMPANY">Empresa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.targetType !== 'COMPANY' && (
          <div className="space-y-2">
            <Label>{targetTypeLabels[form.targetType]}</Label>
            <Select value={form.targetId ?? ''} onValueChange={handleTargetSelect}>
              <SelectTrigger className="w-full"><SelectValue>{form.targetLabel || 'Selecione'}</SelectValue></SelectTrigger>
              <SelectContent>
                {targetOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Título do documento</Label>
        <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={titlePlaceholders[form.targetType]} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Número (opcional)</Label>
          <Input value={form.documentNumber ?? ''} onChange={(e) => set('documentNumber', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Data de emissão (opcional)</Label>
          <Input type="date" value={form.issueDate ?? ''} onChange={(e) => set('issueDate', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Data de vencimento</Label>
        <Input type="date" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving || (form.targetType !== 'COMPANY' && !form.targetId)}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
