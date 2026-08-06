'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Material, StockItemInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  onSubmit: (data: StockItemInput) => Promise<void>;
  onCancel: () => void;
}

export function StockItemForm({ onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listMaterials(token).then(setMaterials); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!materialId) { setError('Selecione um material.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        materialId,
        quantity: parseFloat(quantity) || 0,
        minQuantity: parseFloat(minQuantity) || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const selected = materials.find((m) => m.id === materialId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Material</Label>
        <Select value={materialId} onValueChange={setMaterialId}>
          <SelectTrigger><SelectValue placeholder="Selecione...">{selected?.name}</SelectValue></SelectTrigger>
          <SelectContent>
            {materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantidade Inicial</Label>
          <Input type="number" step="0.01" min="0" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Estoque Mínimo</Label>
          <Input type="number" step="0.01" min="0" placeholder="0" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}