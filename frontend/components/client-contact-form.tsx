'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClientContact, ClientContactInput } from '@/lib/api';

interface Props {
  clientId: string;
  initialData?: ClientContact;
  onSubmit: (data: ClientContactInput) => Promise<void>;
  onCancel: () => void;
}

function empty(clientId: string): ClientContactInput {
  return { clientId, name: '', role: '', phone: '', email: '', notes: '' };
}

export function ClientContactForm({ clientId, initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ClientContactInput>(empty(clientId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        clientId: initialData.clientId,
        name: initialData.name,
        role: initialData.role ?? '',
        phone: initialData.phone ?? '',
        email: initialData.email ?? '',
        notes: initialData.notes ?? '',
      });
    }
  }, [initialData]);

  function set<K extends keyof ClientContactInput>(field: K, value: ClientContactInput[K]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        role: form.role || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        notes: form.notes || undefined,
      });
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
          <Label>Nome</Label>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Cargo/Função</Label>
          <Input value={form.role ?? ''} onChange={(e) => set('role', e.target.value)} placeholder="Ex: Comprador, Engenheiro responsável" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
