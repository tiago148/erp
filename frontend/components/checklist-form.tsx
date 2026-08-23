'use client';

import { useState } from 'react';
import { Checklist, ChecklistInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  initialData?: Checklist;
  onSubmit: (data: ChecklistInput) => Promise<void>;
  onCancel: () => void;
}

export const checklistContextLabels: Record<string, string> = {
  mobilizacao: 'Antes de sair para a obra',
  desmobilizacao: 'Ao encerrar a obra',
  entrega: 'Antes de entregar ao cliente',
  inicio: 'Início de turno',
  compra: 'Recebimento de material',
  outro: 'Outro momento',
};

const MAX_ITEMS = 10;

export function ChecklistForm({ initialData, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [context, setContext] = useState(initialData?.context || 'mobilizacao');
  const [items, setItems] = useState<string[]>(initialData?.items?.length ? initialData.items : ['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanItems = items.map((i) => i.trim()).filter(Boolean);
    if (!title.trim()) { setError('Informe o nome.'); return; }
    if (cleanItems.length === 0) { setError('Adicione ao menos um item.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({ title, context, items: cleanItems });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar checklist');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mobilização de obra" required />
        </div>
        <div className="space-y-2">
          <Label>Quando usar</Label>
          <Select value={context} onValueChange={(v) => setContext(v || 'mobilizacao')}>
            <SelectTrigger className="w-full"><SelectValue>{checklistContextLabels[context]}</SelectValue></SelectTrigger>
            <SelectContent>
              {Object.entries(checklistContextLabels).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md p-3 space-y-2">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Itens</Label>
          <Button type="button" size="sm" variant="outline" disabled={items.length >= MAX_ITEMS} onClick={() => setItems([...items, ''])}>
            <Plus size={14} className="mr-1" />Item
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Máximo dez itens — checklist longo não é usado.</p>
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <span className="w-6 text-center text-xs text-muted-foreground shrink-0">{idx + 1}</span>
            <Input value={item} placeholder="Item a verificar" onChange={(e) => {
              const arr = [...items]; arr[idx] = e.target.value; setItems(arr);
            }} />
            <Button type="button" size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
