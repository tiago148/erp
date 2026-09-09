'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Material, StockItem, StockItemInput } from '@/lib/api';
import { reorderPointPreview } from '@/lib/abc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  initialData?: StockItem;
  onSubmit: (data: StockItemInput) => Promise<void>;
  onCancel: () => void;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export function StockItemForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState(initialData?.materialId || '');
  const [quantity, setQuantity] = useState(initialData ? String(initialData.quantity) : '');
  const [minQuantity, setMinQuantity] = useState(initialData ? String(initialData.minQuantity) : '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [addrStreet, setAddrStreet] = useState(initialData?.addrStreet || '');
  const [addrShelf, setAddrShelf] = useState(initialData?.addrShelf || '');
  const [addrLevel, setAddrLevel] = useState(initialData?.addrLevel || '');
  const [addrPosition, setAddrPosition] = useState(initialData?.addrPosition || '');
  const [abcClass, setAbcClass] = useState<'AUTO' | 'A' | 'B' | 'C'>(initialData?.abcClass || 'AUTO');
  const [monthlyConsumption, setMonthlyConsumption] = useState(
    initialData?.monthlyConsumption != null ? String(initialData.monthlyConsumption) : '',
  );
  const [leadTimeDays, setLeadTimeDays] = useState(initialData ? String(initialData.leadTimeDays) : '7');
  const [serviceLevelZ, setServiceLevelZ] = useState(initialData ? String(initialData.serviceLevelZ) : '1.65');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listMaterials(token).then(setMaterials); }, [token]);

  const consForPreview =
    monthlyConsumption !== ''
      ? parseFloat(monthlyConsumption)
      : initialData?.monthlyConsumptionResolved ?? 0;
  const pp = reorderPointPreview(consForPreview, parseFloat(leadTimeDays), parseFloat(serviceLevelZ));

  const addrPreview = addrStreet && addrShelf
    ? [addrStreet, addrShelf, addrLevel, addrPosition].filter(Boolean).join('-').toUpperCase()
    : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!materialId) { setError('Selecione um material.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        materialId,
        quantity: parseFloat(quantity) || 0,
        minQuantity: parseFloat(minQuantity) || Math.round(pp.reorderPoint),
        location: location || undefined,
        addrStreet: addrStreet.toUpperCase() || undefined,
        addrShelf: addrShelf || undefined,
        addrLevel: addrLevel || undefined,
        addrPosition: addrPosition || undefined,
        abcClass,
        monthlyConsumption: monthlyConsumption !== '' ? parseFloat(monthlyConsumption) : undefined,
        leadTimeDays: parseInt(leadTimeDays) || 7,
        serviceLevelZ: parseFloat(serviceLevelZ) || 1.65,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const selected = materials.find((m) => m.id === materialId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      <div className="space-y-2">
        <Label>Material</Label>
        <Select value={materialId} onValueChange={(v) => setMaterialId(v ?? '')} disabled={!!initialData}>
          <SelectTrigger className={initialData ? 'opacity-70' : ''}><SelectValue placeholder="Selecione...">{selected?.name}</SelectValue></SelectTrigger>
          <SelectContent>
            {materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Quantidade {initialData && '(use "Movimentar")'}</Label>
          <Input type="number" step="0.01" min="0" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={!!initialData} className={initialData ? 'opacity-70' : ''} />
        </div>
        <div className="space-y-2">
          <Label>Estoque Mínimo</Label>
          <Input type="number" step="0.01" min="0" placeholder="auto" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Classe de giro</Label>
          <Select value={abcClass} onValueChange={(v) => setAbcClass((v as 'AUTO' | 'A' | 'B' | 'C') ?? 'AUTO')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTO">Automática (curva ABC)</SelectItem>
              <SelectItem value="A">A — alto giro</SelectItem>
              <SelectItem value="B">B — giro médio</SelectItem>
              <SelectItem value="C">C — giro baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Endereço no almoxarifado</Label>
        <div className="grid grid-cols-5 gap-2">
          <Input maxLength={2} placeholder="Rua" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value.toUpperCase())} />
          <Input maxLength={2} placeholder="Estante" value={addrShelf} onChange={(e) => setAddrShelf(e.target.value)} />
          <Input maxLength={1} placeholder="Nível" value={addrLevel} onChange={(e) => setAddrLevel(e.target.value)} />
          <Input maxLength={2} placeholder="Posição" value={addrPosition} onChange={(e) => setAddrPosition(e.target.value)} />
          <Input placeholder="Ou local livre" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">
          {addrPreview
            ? <>Endereço: <span className="font-mono text-primary">{addrPreview}</span></>
            : location
              ? <>Local livre: <span className="font-mono text-foreground">{location}</span></>
              : 'Preencha rua e estante, ou informe um local livre.'}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Reposição</Label>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Consumo médio mensal</Label>
            <Input type="number" step="0.01" placeholder="do histórico" value={monthlyConsumption} onChange={(e) => setMonthlyConsumption(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Prazo de entrega (dias)</Label>
            <Input type="number" step="1" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nível de serviço</Label>
            <Select value={serviceLevelZ} onValueChange={(v) => setServiceLevelZ(v ?? '1.65')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1.65">95% — itens A</SelectItem>
                <SelectItem value="1.28">90% — itens B</SelectItem>
                <SelectItem value="1.04">85% — itens C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border bg-info/5 p-3 text-xs">
          <p className="uppercase tracking-wide font-bold text-info mb-1">Ponto de pedido calculado</p>
          {pp.reorderPoint > 0 ? (
            <div className="space-y-0.5 font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">Consumo diário</span><span>{fmt(pp.dailyConsumption)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Estoque de segurança</span><span>{fmt(pp.safetyStock)}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1 font-semibold"><span>Comprar ao chegar em</span><span className="text-info">{Math.round(pp.reorderPoint)}</span></div>
            </div>
          ) : (
            <p className="text-muted-foreground">Informe o consumo médio mensal (ou deixe o sistema calcular do histórico).</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
