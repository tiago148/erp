'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Employee, DdsInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  onSubmit: (data: DdsInput) => Promise<void>;
  onCancel: () => void;
}

export function DdsForm({ onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [topic, setTopic] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listEmployees(token).then(setEmployees); }, [token]);

  function toggleParticipant(id: string) {
    setParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({ date, topic, participants, notes: notes || undefined });
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
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Tema</Label>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Uso de EPI, Trabalho em altura" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Participantes</Label>
        <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto border rounded-md p-2">
          {employees.length === 0 && <p className="text-xs text-muted-foreground">Nenhum funcionário cadastrado.</p>}
          {employees.map((e) => (
            <label key={e.id} className="flex items-center gap-1.5 text-sm border rounded-md px-2 py-1 cursor-pointer hover:bg-muted">
              <input type="checkbox" checked={participants.includes(e.id)} onChange={() => toggleParticipant(e.id)} />
              {e.name}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}