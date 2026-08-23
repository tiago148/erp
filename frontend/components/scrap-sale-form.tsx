'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, MaterialSurplus, ScrapSaleInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  initialSurplusId?: string;
  onSubmit: (data: ScrapSaleInput) => Promise<void>;
  onCancel: () => void;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ScrapSaleForm({ initialSurplusId, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [pendingSurpluses, setPendingSurpluses] = useState<MaterialSurplus[]>([]);
  const [surplusId, setSurplusId] = useState(initialSurplusId || '');
  const [description, setDescription] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listMaterialSurpluses(token, { status: 'PENDING' }).then((list) => {
      setPendingSurpluses(list);
      if (initialSurplusId) {
        const s = list.find((x) => x.id === initialSurplusId);
        if (s) setDescription(`${s.material.name}${s.alloy ? ` (${s.alloy})` : ''} — ${s.project.name}`);
      }
    });
  }, [token, initialSurplusId]);

  const computedTotal = weightKg && pricePerKg ? (parseFloat(weightKg) || 0) * (parseFloat(pricePerKg) || 0) : null;

  function handleSurplusSelect(id: string) {
    setSurplusId(id);
    const s = pendingSurpluses.find((x) => x.id === id);
    if (s && !description) {
      setDescription(`${s.material.name}${s.alloy ? ` (${s.alloy})` : ''} — ${s.project.name}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalTotal = computedTotal ?? (parseFloat(totalValue) || 0);
    if (!description || finalTotal <= 0) { setError('Informe a descrição e o valor total da venda.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        surplusId: surplusId || undefined,
        description,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        pricePerKg: pricePerKg ? parseFloat(pricePerKg) : undefined,
        totalValue: finalTotal,
        buyerName: buyerName || undefined,
        saleDate,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar venda');
    } finally {
      setSaving(false);
    }
  }

  const selectedSurplus = pendingSurpluses.find((s) => s.id === surplusId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Sobra vendida (opcional)</Label>
        <Select value={surplusId} onValueChange={handleSurplusSelect} disabled={!!initialSurplusId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Venda avulsa (sem vincular a uma sobra)">{selectedSurplus ? `${selectedSurplus.material.name} — ${selectedSurplus.project.name}` : undefined}</SelectValue></SelectTrigger>
          <SelectContent>
            {pendingSurpluses.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.material.name} — {s.project.name} ({s.quantity} {s.material.unit})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!initialSurplusId && pendingSurpluses.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma sobra pendente cadastrada — a venda pode ser registrada avulsa mesmo assim.</p>}
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Retalhos de chapa de aço" required />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Peso (kg)</Label>
          <Input type="number" step="0.01" min="0" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Preço/kg (R$)</Label>
          <Input type="number" step="0.01" min="0" value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Valor Total (R$)</Label>
          <Input type="number" step="0.01" min="0.01" value={computedTotal !== null ? computedTotal.toFixed(2) : totalValue} onChange={(e) => setTotalValue(e.target.value)} disabled={computedTotal !== null} required />
        </div>
      </div>
      {computedTotal !== null && (
        <p className="text-xs text-muted-foreground -mt-2">Calculado automaticamente: {weightKg}kg × {fmt(parseFloat(pricePerKg) || 0)} = <span className="font-semibold text-foreground">{fmt(computedTotal)}</span></p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Comprador (opcional)</Label>
          <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Data da Venda</Label>
          <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <p className="text-xs text-muted-foreground">Ao salvar, um lançamento de receita já pago é gerado automaticamente no Financeiro.</p>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Registrar Venda'}</Button>
      </div>
    </form>
  );
}
