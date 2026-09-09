'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, Employee, Tool, ToolInput } from '@/lib/api';

interface Props {
  initialData?: Tool;
  onSubmit: (data: ToolInput) => Promise<void>;
  onCancel: () => void;
}

const empty: ToolInput = {
  code: '', name: '', category: '', notes: '',
  custody: 'SHARED', responsibleEmployeeId: null, acquisitionValue: 0,
};

const custodyHint: Record<string, string> = {
  SHARED: 'Circula entre obras e volta ao depósito. Movimentação registrada no dia a dia e conferida no retorno de obra.',
  INDIVIDUAL: 'Fica com o funcionário enquanto ele estiver na empresa — é carga pessoal, não consumo de obra. Volta na devolução ou no desligamento. Entra no preço pelos encargos complementares, em R$/hora.',
  FIXED: 'Não sai do galpão. Se for máquina de porte, entra no preço pelo custo horário de uso.',
};

export function ToolForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [form, setForm] = useState<ToolInput>(empty);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listEmployees(token).then(setEmployees); }, [token]);

  useEffect(() => {
    if (initialData) {
      setForm({
        code: initialData.code || '',
        name: initialData.name,
        category: initialData.category,
        notes: initialData.notes || '',
        custody: initialData.custody,
        responsibleEmployeeId: initialData.responsibleEmployeeId ?? null,
        acquisitionValue: initialData.acquisitionValue,
      });
    }
  }, [initialData]);

  function set<K extends keyof ToolInput>(field: K, value: ToolInput[K]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.custody === 'INDIVIDUAL' && !form.responsibleEmployeeId) {
      setError('Ferramenta individual precisa de um responsável.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({ ...form, responsibleEmployeeId: form.responsibleEmployeeId || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Código</Label>
          <Input value={form.code} onChange={(e) => set('code', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Ex: Elétrica, Solda, Corte" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nome da Ferramenta</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de custódia</Label>
          <Select value={form.custody} onValueChange={(v) => set('custody', (v as ToolInput['custody']) ?? 'SHARED')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SHARED">Compartilhada — circula entre obras</SelectItem>
              <SelectItem value="INDIVIDUAL">Individual — fica com o funcionário</SelectItem>
              <SelectItem value="FIXED">Fixa — não sai do galpão</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor de aquisição (R$)</Label>
          <Input type="number" step="0.01" min="0" value={form.acquisitionValue} onChange={(e) => set('acquisitionValue', parseFloat(e.target.value) || 0)} />
        </div>
      </div>
      {form.custody === 'INDIVIDUAL' && (
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Select value={form.responsibleEmployeeId ?? ''} onValueChange={(v) => set('responsibleEmployeeId', v || null)}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <p className="rounded-md border-l-2 border-primary bg-muted/40 p-2.5 text-xs leading-relaxed">{custodyHint[form.custody]}</p>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
