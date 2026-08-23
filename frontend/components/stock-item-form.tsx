'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Material, StockItem, StockItemInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  initialData?: StockItem;
  onSubmit: (data: StockItemInput) => Promise<void>;
  onCancel: () => void;
}

export function StockItemForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState(initialData?.materialId || '');
  const [quantity, setQuantity] = useState(initialData ? String(initialData.quantity) : '');
  const [minQuantity, setMinQuantity] = useState(initialData ? String(initialData.minQuantity) : '');
  const [location, setLocation] = useState(initialData?.location || '');
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
        location: location || undefined,
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
        <Select value={materialId} onValueChange={(v) => setMaterialId(v ?? '')} disabled={!!initialData}>
          <SelectTrigger className={initialData ? 'opacity-70' : ''}><SelectValue placeholder="Selecione...">{selected?.name}</SelectValue></SelectTrigger>
          <SelectContent>
            {materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantidade {initialData && '(use "Movimentar" para ajustar)'}</Label>
          <Input type="number" step="0.01" min="0" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={!!initialData} className={initialData ? 'opacity-70' : ''} />
        </div>
        <div className="space-y-2">
          <Label>Estoque Mínimo</Label>
          <Input type="number" step="0.01" min="0" placeholder="0" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Localização</Label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Galpão A – Rack 1" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
