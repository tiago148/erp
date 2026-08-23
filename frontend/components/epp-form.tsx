'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Employee, EppInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  onSubmit: (data: EppInput) => Promise<void>;
  onCancel: () => void;
}

export function EppForm({ onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [itemName, setItemName] = useState('');
  const [signed, setSigned] = useState(false);
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
      await onSubmit({ employeeId, itemName, signed, notes: notes || undefined });
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
        <Label>Item Entregue</Label>
        <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Ex: Capacete, Bota, Óculos de proteção" required />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="signed" checked={signed} onChange={(e) => setSigned(e.target.checked)} />
        <Label htmlFor="signed">Recibo assinado pelo funcionário</Label>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}