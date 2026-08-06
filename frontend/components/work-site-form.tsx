'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Client, WorkSite, WorkSiteInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  initialData?: WorkSite;
  onSubmit: (data: WorkSiteInput) => Promise<void>;
  onCancel: () => void;
}

const empty: WorkSiteInput = { name: '', clientId: '', address: '', city: '', state: '', distanceKm: undefined, notes: '' };

export function WorkSiteForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<WorkSiteInput>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listClients(token).then(setClients); }, [token]);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        clientId: initialData.clientId,
        address: initialData.address,
        city: initialData.city || '',
        state: initialData.state || '',
        distanceKm: initialData.distanceKm,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  function set<K extends keyof WorkSiteInput>(field: K, value: WorkSiteInput[K]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const selectedClient = clients.find((c) => c.id === form.clientId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Local</Label>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Obra Fábrica Sul" required />
        </div>
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={form.clientId} onValueChange={(v) => set('clientId', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione...">{selectedClient?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Endereço</Label>
        <Input value={form.address} onChange={(e) => set('address', e.target.value)} required />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Input value={form.state} onChange={(e) => set('state', e.target.value)} maxLength={2} />
        </div>
        <div className="space-y-2">
          <Label>Distância (km, só ida)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Ex: 50"
            value={form.distanceKm ?? ''}
            onChange={(e) => set('distanceKm', e.target.value ? parseFloat(e.target.value) : undefined)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <p className="text-xs text-gray-400">Essa distância vai preencher automaticamente o deslocamento ao criar orçamentos.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}