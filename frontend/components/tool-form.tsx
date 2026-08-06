'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tool, ToolInput } from '@/lib/api';

interface Props {
  initialData?: Tool;
  onSubmit: (data: ToolInput) => Promise<void>;
  onCancel: () => void;
}

const empty: ToolInput = { code: '', name: '', category: '', notes: '' };

export function ToolForm({ initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ToolInput>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        code: initialData.code || '',
        name: initialData.name,
        category: initialData.category,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  function set<K extends keyof ToolInput>(field: K, value: ToolInput[K]) {
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