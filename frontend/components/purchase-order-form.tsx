'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Supplier, Material, Project, PurchaseOrderInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  onSubmit: (data: PurchaseOrderInput) => Promise<void>;
  onCancel: () => void;
}

export function PurchaseOrderForm({ onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [destinationProjectId, setDestinationProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ materialId: string; quantity: string; unitCost: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listSuppliers(token).then(setSuppliers);
    api.listMaterials(token).then(setMaterials);
    api.listProjects(token).then(setProjects);
  }, [token]);

  function addItem() {
    setItems([...items, { materialId: '', quantity: '', unitCost: '' }]);
  }

  function updateItem(idx: number, field: 'materialId' | 'quantity' | 'unitCost', value: string) {
    const arr = [...items];
    arr[idx] = { ...arr[idx], [field]: value };
    if (field === 'materialId') {
      const material = materials.find((m) => m.id === value);
      if (material) arr[idx].unitCost = String(material.unitCost);
    }
    setItems(arr);
  }

  const total = items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitCost) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) { setError('Selecione um fornecedor.'); return; }
    if (items.length === 0) { setError('Adicione ao menos um item.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        supplierId,
        notes,
        requestedBy: requestedBy || undefined,
        destinationProjectId: destinationProjectId || undefined,
        items: items.map((i) => ({
          materialId: i.materialId,
          quantity: parseFloat(i.quantity) || 0,
          unitCost: parseFloat(i.unitCost) || 0,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar pedido');
    } finally {
      setSaving(false);
    }
  }

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Fornecedor</Label>
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{selectedSupplier?.name}</SelectValue></SelectTrigger>
          <SelectContent>
            {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {suppliers.length === 0 && <p className="text-xs text-amber-600">Nenhum fornecedor cadastrado ainda.</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Destino</Label>
          <Select value={destinationProjectId} onValueChange={setDestinationProjectId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Estoque Geral">{projects.find((p) => p.id === destinationProjectId)?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400">Deixe em branco para o pedido entrar no estoque geral.</p>
        </div>
        <div className="space-y-2">
          <Label>Responsável (opcional)</Label>
          <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} placeholder="Quem está solicitando" />
        </div>
      </div>

      <div className="border rounded-md p-4 space-y-3 bg-white">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Itens do Pedido</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>

        {items.length === 0 && <p className="text-sm text-gray-400">Nenhum item adicionado.</p>}

        {items.length > 0 && (
          <div className="grid grid-cols-[1fr_90px_110px_100px_36px] gap-2 text-xs text-gray-500 font-medium px-1">
            <span>Material</span>
            <span>Quantidade</span>
            <span>Custo Unit.</span>
            <span>Subtotal</span>
            <span></span>
          </div>
        )}

        {items.map((item, idx) => {
          const material = materials.find((m) => m.id === item.materialId);
          const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0);
          return (
            <div key={idx} className="grid grid-cols-[1fr_90px_110px_100px_36px] gap-2 items-center">
              <Select value={item.materialId} onValueChange={(v) => updateItem(idx, 'materialId', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o material">{material ? `${material.name} (${material.unit})` : undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" placeholder="0" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
              <Input type="number" step="0.01" placeholder="0,00" value={item.unitCost} onChange={(e) => updateItem(idx, 'unitCost', e.target.value)} />
              <span className="text-sm text-gray-500 text-right">{fmt(subtotal)}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}

        {items.length > 0 && (
          <div className="flex justify-end font-semibold text-sm pt-2 border-t">Total: {fmt(total)}</div>
        )}

        {materials.length === 0 && (
          <p className="text-xs text-amber-600">Nenhum material cadastrado ainda — cadastre em "Materiais" primeiro.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Criar Pedido'}</Button>
      </div>
    </form>
  );
}