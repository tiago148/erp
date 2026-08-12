'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Material, QuotationInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

interface Props {
  onSubmit: (data: QuotationInput) => Promise<void>;
  onCancel: () => void;
}

export function QuotationForm({ onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<{ materialId: string; quantity: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listMaterials(token).then(setMaterials); }, [token]);

  function addItem() {
    setItems([...items, { materialId: '', quantity: '' }]);
  }

  function updateItem(idx: number, field: 'materialId' | 'quantity', value: string) {
    const arr = [...items];
    arr[idx] = { ...arr[idx], [field]: value };
    setItems(arr);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { setError('Adicione ao menos um item para cotar.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        description: description || undefined,
        items: items.map((i) => ({ materialId: i.materialId, quantity: parseFloat(i.quantity) || 0 })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cotação');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Materiais para obra X" />
      </div>

      <div className="border rounded-md p-4 space-y-3 bg-white">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Itens a Cotar</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {items.length === 0 && <p className="text-sm text-gray-400">Nenhum item adicionado.</p>}
        {items.map((item, idx) => {
          const material = materials.find((m) => m.id === item.materialId);
          return (
            <div key={idx} className="flex gap-2 items-center">
              <Select value={item.materialId} onValueChange={(v) => updateItem(idx, 'materialId', v)}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione o material">{material ? `${material.name} (${material.unit})` : undefined}</SelectValue></SelectTrigger>
                <SelectContent>
                  {materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" min="0.01" className="w-28" placeholder="Qtd." value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
              <Button type="button" size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Criando...' : 'Criar Cotação'}</Button>
      </div>
    </form>
  );
}
