'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Supplier, SupplierInput } from '@/lib/api';

interface Props {
  initialData?: Supplier;
  onSubmit: (data: SupplierInput) => Promise<void>;
  onCancel: () => void;
}

const empty: SupplierInput = { name: '', document: '', phone: '', email: '', address: '', notes: '' };

export function SupplierForm({ initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<SupplierInput>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        document: initialData.document || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  function set<K extends keyof SupplierInput>(field: K, value: SupplierInput[K]) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>CNPJ/CPF</Label>
          <Input value={form.document} onChange={(e) => set('document', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Endereço</Label>
        <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}