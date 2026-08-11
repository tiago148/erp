'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Employee, TrainingInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  onSubmit: (data: TrainingInput) => Promise<void>;
  onCancel: () => void;
}

export function TrainingForm({ onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [nrType, setNrType] = useState('');
  const [completedAt, setCompletedAt] = useState(new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listEmployees(token).then(setEmployees); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) { setError('Selecione um funcionário.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({ employeeId, nrType, completedAt, expiresAt: expiresAt || undefined, notes: notes || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const selected = employees.find((e) => e.id === employeeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Funcionário</Label>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{selected?.name}</SelectValue></SelectTrigger>
          <SelectContent>
            {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Norma (NR)</Label>
        <Input value={nrType} onChange={(e) => setNrType(e.target.value)} placeholder="Ex: NR-35, NR-10, NR-33" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Conclusão</Label>
          <Input type="date" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Validade (opcional)</Label>
          <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}