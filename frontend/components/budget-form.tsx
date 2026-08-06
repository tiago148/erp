'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Budget, BudgetInput, Client, Material, LaborRole, Vehicle, WorkSite } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  NEGOTIATING: 'Em Negociação',
};

const regimeLabels: Record<string, string> = {
  SIMPLES: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
  MEI: 'MEI',
};

interface Props {
  initialData?: Budget;
  onSaved: () => void;
}

export function BudgetForm({ initialData, onSaved }: Props) {
  const { token } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [laborRoles, setLaborRoles] = useState<LaborRole[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workSites, setWorkSites] = useState<WorkSite[]>([]);
  const [selectedWorkSiteId, setSelectedWorkSiteId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');
  const [regime, setRegime] = useState(initialData?.regime || 'SIMPLES');
  const [bdiPct, setBdiPct] = useState(initialData?.bdiPct ?? 20);
  const [discountPct, setDiscountPct] = useState(initialData?.discountPct ?? 0);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [materialItems, setMaterialItems] = useState(
    initialData?.materialItems.map((i) => ({ materialId: i.materialId, quantity: i.quantity })) || [],
  );
  const [laborItems, setLaborItems] = useState(
    initialData?.laborItems.map((i) => ({ laborRoleId: i.laborRoleId, hours: i.hours })) || [],
  );
  const [travelItems, setTravelItems] = useState(
    initialData?.travelItems.map((i) => ({
      vehicleId: i.vehicleId,
      distanceKm: i.distanceKm,
      trips: i.trips,
      fuelPrice: i.fuelPrice,
    })) || [],
  );
  const [otherItems, setOtherItems] = useState(
    initialData?.otherItems.map((i) => ({ description: i.description, amount: i.amount })) || [],
  );

  useEffect(() => {
    if (!token) return;
    api.listClients(token).then(setClients);
    api.listMaterials(token).then(setMaterials);
    api.listLaborRoles(token).then(setLaborRoles);
    api.listVehicles(token).then(setVehicles);
    api.listWorkSites(token).then(setWorkSites);
  }, [token]);

function applyWorkSiteDistance(workSiteId: string) {
  setSelectedWorkSiteId(workSiteId);
  const site = workSites.find((w) => w.id === workSiteId);
  if (site?.distanceKm && travelItems.length > 0) {
    const arr = [...travelItems];
    arr[0].distanceKm = Number(site.distanceKm);
    setTravelItems(arr);
  }
}

  function materialCost(materialId: string, qty: number) {
    const m = materials.find((x) => x.id === materialId);
    return m ? m.unitCost * qty : 0;
  }

  function laborCost(laborRoleId: string, hours: number) {
    const r = laborRoles.find((x) => x.id === laborRoleId);
    return r ? r.effectiveHourlyRate * hours : 0;
  }

  function travelCost(t: { vehicleId: string; distanceKm: number; trips: number; fuelPrice: number }) {
    const v = vehicles.find((x) => x.id === t.vehicleId);
    if (!v) return 0;
    const liters = (t.distanceKm * 2 * t.trips) / v.avgConsumption;
    return liters * t.fuelPrice;
  }

 function addTravelItem() {
  const site = workSites.find((w) => w.id === selectedWorkSiteId);
  setTravelItems([
    ...travelItems,
    { vehicleId: '', distanceKm: site?.distanceKm ? Number(site.distanceKm) : 1, trips: 1, fuelPrice: 6 },
  ]);
}

  const materialsTotal = materialItems.reduce((s, i) => s + materialCost(i.materialId, i.quantity), 0);
  const laborTotal = laborItems.reduce((s, i) => s + laborCost(i.laborRoleId, i.hours), 0);
  const travelTotal = travelItems.reduce((s, i) => s + travelCost(i), 0);
  const otherTotal = otherItems.reduce((s, i) => s + i.amount, 0);
  const subtotal = materialsTotal + laborTotal + travelTotal + otherTotal;
  const bdiValue = subtotal * (bdiPct / 100);
  const base = subtotal + bdiValue;
  const discountValue = base * (discountPct / 100);
  const total = base - discountValue;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !clientId) {
      setError('Selecione um cliente.');
      return;
    }
    setSaving(true);
    setError('');

    const data: BudgetInput = {
      clientId,
      status,
      regime,
      bdiPct,
      discountPct,
      notes,
      materialItems,
      laborItems,
      travelItems,
      otherItems,
    };

    try {
      if (initialData) {
        await api.updateBudget(token, initialData.id, data);
      } else {
        await api.createBudget(token, data);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar orçamento');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione...">
                {clients.find((c) => c.id === clientId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {clients.length === 0 && (
            <p className="text-xs text-amber-600">Nenhum cliente cadastrado ainda.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger>
              <SelectValue>{statusLabels[status]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Rascunho</SelectItem>
              <SelectItem value="SENT">Enviado</SelectItem>
              <SelectItem value="APPROVED">Aprovado</SelectItem>
              <SelectItem value="REJECTED">Recusado</SelectItem>
              <SelectItem value="NEGOTIATING">Em Negociação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Local de Obra (preenche a distância automaticamente)</Label>
        <Select value={selectedWorkSiteId} onValueChange={applyWorkSiteDistance}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione (opcional)...">
              {workSites.find((w) => w.id === selectedWorkSiteId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {workSites.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name} {w.distanceKm ? `(${w.distanceKm} km)` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* MATERIAIS */}
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Materiais</Label>
          <Button type="button" size="sm" variant="outline" onClick={() =>
            setMaterialItems([...materialItems, { materialId: '', quantity: 1 }])
          }><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {materialItems.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum material adicionado.</p>
        )}
        {materialItems.length > 0 && (
          <div className="flex gap-2 text-xs text-gray-500 font-medium px-1">
            <span className="flex-1">Material</span>
            <span className="w-28">Quantidade</span>
            <span className="w-24">Subtotal</span>
            <span className="w-9"></span>
          </div>
        )}
        {materialItems.map((item, idx) => {
          const selected = materials.find((m) => m.id === item.materialId);
          return (
            <div key={idx} className="flex gap-2 items-center">
              <Select value={item.materialId} onValueChange={(v) => {
                const arr = [...materialItems]; arr[idx].materialId = v; setMaterialItems(arr);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o material">
                    {selected ? `${selected.name} (${fmt(selected.unitCost)}/${selected.unit})` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({fmt(m.unitCost)}/{m.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" min="0.01" className="w-28" placeholder="Qtd." value={item.quantity}
                onChange={(e) => { const arr = [...materialItems]; arr[idx].quantity = parseFloat(e.target.value) || 0; setMaterialItems(arr); }} />
              <span className="w-24 text-sm text-gray-500 text-right">{fmt(materialCost(item.materialId, item.quantity))}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setMaterialItems(materialItems.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
        {materials.length === 0 && (
          <p className="text-xs text-amber-600">Nenhum material cadastrado ainda — cadastre em "Materiais" primeiro.</p>
        )}
      </div>

      {/* MAO DE OBRA */}
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Mão de Obra</Label>
          <Button type="button" size="sm" variant="outline" onClick={() =>
            setLaborItems([...laborItems, { laborRoleId: '', hours: 1 }])
          }><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {laborItems.length === 0 && (
          <p className="text-sm text-gray-400">Nenhuma mão de obra adicionada.</p>
        )}
        {laborItems.length > 0 && (
          <div className="flex gap-2 text-xs text-gray-500 font-medium px-1">
            <span className="flex-1">Função</span>
            <span className="w-28">Horas</span>
            <span className="w-24">Subtotal</span>
            <span className="w-9"></span>
          </div>
        )}
        {laborItems.map((item, idx) => {
          const selected = laborRoles.find((r) => r.id === item.laborRoleId);
          return (
            <div key={idx} className="flex gap-2 items-center">
              <Select value={item.laborRoleId} onValueChange={(v) => {
                const arr = [...laborItems]; arr[idx].laborRoleId = v; setLaborItems(arr);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione a função">
                    {selected ? `${selected.name} (${fmt(selected.effectiveHourlyRate)}/h)` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {laborRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({fmt(r.effectiveHourlyRate)}/h)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" step="0.5" min="0.5" className="w-28" placeholder="Horas" value={item.hours}
                onChange={(e) => { const arr = [...laborItems]; arr[idx].hours = parseFloat(e.target.value) || 0; setLaborItems(arr); }} />
              <span className="w-24 text-sm text-gray-500 text-right">{fmt(laborCost(item.laborRoleId, item.hours))}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setLaborItems(laborItems.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
        {laborRoles.length === 0 && (
          <p className="text-xs text-amber-600">Nenhuma função cadastrada ainda — cadastre em "Mão de Obra" primeiro.</p>
        )}
      </div>

      {/* DESLOCAMENTO */}
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Deslocamento</Label>
          <Button type="button" size="sm" variant="outline" onClick={addTravelItem}>
            <Plus size={14} className="mr-1" />Adicionar
          </Button>
        </div>
        {travelItems.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum deslocamento adicionado.</p>
        )}
        {travelItems.length > 0 && (
          <div className="flex gap-2 text-xs text-gray-500 font-medium px-1 flex-wrap">
            <span className="w-40">Veículo</span>
            <span className="w-24">Distância (km, ida)</span>
            <span className="w-24">Nº de viagens</span>
            <span className="w-24">Preço/litro (R$)</span>
            <span className="w-24">Subtotal</span>
          </div>
        )}
        {travelItems.map((item, idx) => {
          const selected = vehicles.find((v) => v.id === item.vehicleId);
          return (
            <div key={idx} className="flex gap-2 items-center flex-wrap">
              <Select value={item.vehicleId} onValueChange={(v) => {
                const arr = [...travelItems]; arr[idx].vehicleId = v; setTravelItems(arr);
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Selecione o veículo">
                    {selected?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" step="1" placeholder="Ex: 50" className="w-24" value={item.distanceKm}
                onChange={(e) => { const arr = [...travelItems]; arr[idx].distanceKm = parseFloat(e.target.value) || 0; setTravelItems(arr); }} />
              <Input type="number" step="1" placeholder="Ex: 2" className="w-24" value={item.trips}
                onChange={(e) => { const arr = [...travelItems]; arr[idx].trips = parseInt(e.target.value) || 0; setTravelItems(arr); }} />
              <Input type="number" step="0.01" placeholder="Ex: 6,20" className="w-24" value={item.fuelPrice}
                onChange={(e) => { const arr = [...travelItems]; arr[idx].fuelPrice = parseFloat(e.target.value) || 0; setTravelItems(arr); }} />
              <span className="w-24 text-sm text-gray-500 text-right">{fmt(travelCost(item))}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setTravelItems(travelItems.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
        <p className="text-xs text-gray-400">Distância é só de ida — o sistema calcula ida e volta automaticamente.</p>
        {vehicles.length === 0 && (
          <p className="text-xs text-amber-600">Nenhum veículo cadastrado ainda — cadastre em "Veículos" primeiro.</p>
        )}
      </div>

      {/* OUTROS */}
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Outros Custos</Label>
          <Button type="button" size="sm" variant="outline" onClick={() =>
            setOtherItems([...otherItems, { description: '', amount: 0 }])
          }><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {otherItems.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum custo extra adicionado.</p>
        )}
        {otherItems.length > 0 && (
          <div className="flex gap-2 text-xs text-gray-500 font-medium px-1">
            <span className="flex-1">Descrição</span>
            <span className="w-28">Valor (R$)</span>
            <span className="w-9"></span>
          </div>
        )}
        {otherItems.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Input placeholder="Ex: Taxa de entrega, aluguel de equipamento" className="flex-1" value={item.description}
              onChange={(e) => { const arr = [...otherItems]; arr[idx].description = e.target.value; setOtherItems(arr); }} />
            <Input type="number" step="0.01" placeholder="R$" className="w-28" value={item.amount}
              onChange={(e) => { const arr = [...otherItems]; arr[idx].amount = parseFloat(e.target.value) || 0; setOtherItems(arr); }} />
            <Button type="button" size="icon" variant="ghost" onClick={() => setOtherItems(otherItems.filter((_, i) => i !== idx))}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>

      {/* REGIME / BDI / DESCONTO */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Regime Tributário</Label>
          <Select value={regime} onValueChange={(v) => setRegime(v as any)}>
            <SelectTrigger>
              <SelectValue>{regimeLabels[regime]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SIMPLES">Simples Nacional</SelectItem>
              <SelectItem value="LUCRO_PRESUMIDO">Lucro Presumido</SelectItem>
              <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
              <SelectItem value="MEI">MEI</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>BDI (%)</Label>
          <Input type="number" step="0.5" value={bdiPct} onChange={(e) => setBdiPct(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label>Desconto (%)</Label>
          <Input type="number" step="0.5" value={discountPct} onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input placeholder="Prazo de execução, forma de pagamento, garantia..." value={notes}
          onChange={(e) => setNotes(e.target.value)} />
      </div>

      {/* RESUMO */}
      <div className="bg-gray-50 rounded-md p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
        <div className="flex justify-between"><span>BDI ({bdiPct}%)</span><span>{fmt(bdiValue)}</span></div>
        <div className="flex justify-between font-medium"><span>Base</span><span>{fmt(base)}</span></div>
        <div className="flex justify-between text-red-600"><span>Desconto ({discountPct}%)</span><span>- {fmt(discountValue)}</span></div>
        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total (estimado)</span><span>{fmt(total)}</span></div>
        <p className="text-xs text-gray-400 mt-1">*Impostos do regime tributário são calculados e aplicados após salvar.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Salvando...' : 'Salvar Orçamento'}
      </Button>
    </form>
  );
}