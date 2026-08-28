'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Budget, BudgetInput, Client, Material, LaborRole, Vehicle, WorkSite, Settings, Employee, CostComposition, ThirdPartyService, RentalEquipment } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { marginBadgeVariant, marginLabel } from '@/lib/utils';
import { computeIndirectCost } from '@/lib/overhead';
import { getImpostoPct } from '@/lib/tax-table';
import { Trash2, Plus, Ruler } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface MaterialMeasureDraft { lengthM: string; pieces: string }
interface MaterialItemDraft { materialId: string; quantity: number; measures: MaterialMeasureDraft[] }

// Romaneio de corte: quando o item tem medidas lancadas (comprimento + numero
// de pecas cortadas com aquele comprimento), a quantidade total do item
// (em metros) e sempre a soma delas -- nunca digitada manualmente.
function measuresTotal(measures: MaterialMeasureDraft[]) {
  return measures.reduce((sum, m) => sum + (parseFloat(m.lengthM) || 0) * (parseInt(m.pieces, 10) || 0), 0);
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [compositions, setCompositions] = useState<CostComposition[]>([]);
  const [thirdPartyServices, setThirdPartyServices] = useState<ThirdPartyService[]>([]);
  const [rentalEquipment, setRentalEquipment] = useState<RentalEquipment[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedWorkSiteId, setSelectedWorkSiteId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId || '');
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');
  const [regime, setRegime] = useState(initialData?.regime || 'SIMPLES');
  const [lucroPct, setLucroPct] = useState(initialData?.lucroPct ?? 15);
  const [contingenciaPct, setContingenciaPct] = useState(initialData?.contingenciaPct ?? 0);
  const [prazoRecebimentoDias, setPrazoRecebimentoDias] = useState(initialData?.prazoRecebimentoDias ?? 0);
  const [taxaCapitalPct, setTaxaCapitalPct] = useState(initialData?.taxaCapitalPct ?? 1.5);
  const [discountPct, setDiscountPct] = useState(initialData?.discountPct ?? 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [projectDays, setProjectDays] = useState(initialData?.projectDays ?? 0);
  const [fixedExpensesTotal, setFixedExpensesTotal] = useState(0);
  const isNewRef = useRef(!initialData);

  const [materialItems, setMaterialItems] = useState<MaterialItemDraft[]>(
    initialData?.materialItems.map((i) => ({
      materialId: i.materialId,
      quantity: i.quantity,
      measures: i.measures.map((m) => ({ lengthM: String(m.lengthM), pieces: String(m.pieces) })),
    })) || [],
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
  const [compositionItems, setCompositionItems] = useState(
    initialData?.compositionItems.map((i) => ({ compositionId: i.compositionId, quantity: i.quantity })) || [],
  );
  const [serviceItems, setServiceItems] = useState(
    initialData?.serviceItems.map((i) => ({ thirdPartyServiceId: i.thirdPartyServiceId, quantity: i.quantity })) || [],
  );
  const [rentalItems, setRentalItems] = useState(
    initialData?.rentalItems.map((i) => ({ rentalEquipmentId: i.rentalEquipmentId, period: i.period })) || [],
  );

  useEffect(() => {
    if (!token) return;
    api.listClients(token).then(setClients);
    api.listMaterials(token).then(setMaterials);
    api.listLaborRoles(token).then(setLaborRoles);
    api.listVehicles(token).then(setVehicles);
    api.listWorkSites(token).then(setWorkSites);
    api.listEmployees(token).then(setEmployees);
    api.listCostCompositions(token).then(setCompositions);
    api.listThirdPartyServices(token).then(setThirdPartyServices);
    api.listRentalEquipment(token).then(setRentalEquipment);
    api.getSettings(token).then((s) => {
      setSettings(s);
      if (isNewRef.current) {
        setLucroPct(s.defaultLucroPct);
        setContingenciaPct(s.defaultContingenciaPct);
        setTaxaCapitalPct(s.defaultTaxaCapitalPct);
      }
    });
    Promise.all([api.listFixedExpenses(token), api.listAssets(token)]).then(([expenses, assets]) => {
      setFixedExpensesTotal(
        expenses.reduce((s, e) => s + e.amount, 0) +
        assets.reduce((s, a) => s + a.totalMonthlyCost, 0),
      );
    });
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

  function compositionCost(compositionId: string, qty: number) {
    const c = compositions.find((x) => x.id === compositionId);
    return c ? c.costs.unitCost * qty : 0;
  }

  function serviceCost(thirdPartyServiceId: string, qty: number) {
    const s = thirdPartyServices.find((x) => x.id === thirdPartyServiceId);
    return s ? s.unitPrice * qty : 0;
  }

  function rentalCost(rentalEquipmentId: string, period: number) {
    const r = rentalEquipment.find((x) => x.id === rentalEquipmentId);
    return r ? r.unitPrice * period + r.mobilizationCost : 0;
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
  const laborHours = laborItems.reduce((s, i) => s + i.hours, 0);
  const travelTotal = travelItems.reduce((s, i) => s + travelCost(i), 0);
  const otherTotal = otherItems.reduce((s, i) => s + i.amount, 0);
  const compositionsTotal = compositionItems.reduce((s, i) => s + compositionCost(i.compositionId, i.quantity), 0);
  const servicesTotal = serviceItems.reduce((s, i) => s + serviceCost(i.thirdPartyServiceId, i.quantity), 0);
  const rentalsTotal = rentalItems.reduce((s, i) => s + rentalCost(i.rentalEquipmentId, i.period), 0);
  const subtotal = materialsTotal + laborTotal + travelTotal + otherTotal + compositionsTotal + servicesTotal + rentalsTotal;
  const indirectCostValue = computeIndirectCost(settings, fixedExpensesTotal, subtotal, laborHours, projectDays);
  const costWithIndirect = subtotal + indirectCostValue;

  const contingenciaValue = costWithIndirect * (contingenciaPct / 100);
  const custoFinanceiroValue = (costWithIndirect + contingenciaValue) * (taxaCapitalPct / 100) * (prazoRecebimentoDias / 30);
  const custoTotal = costWithIndirect + contingenciaValue + custoFinanceiroValue;

  const impostoPct = getImpostoPct(regime);
  const rawDivisor = 1 - (impostoPct + lucroPct) / 100;
  const pricingImpossible = rawDivisor <= 0.02;
  const divisor = pricingImpossible ? 0.02 : rawDivisor;
  const pvCheio = custoTotal / divisor;

  const discountValue = pvCheio * (discountPct / 100);
  const total = pvCheio - discountValue;
  const impostoReal = total * (impostoPct / 100);
  const estimatedMargin = total - custoTotal - impostoReal;
  const estimatedMarginPct = total > 0 ? (estimatedMargin / total) * 100 : 0;
  const marginHealthyPct = settings?.marginHealthyPct ?? 20;
  const marginWarningPct = settings?.marginWarningPct ?? 10;

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
      employeeId: employeeId || undefined,
      status,
      regime,
      lucroPct,
      contingenciaPct,
      prazoRecebimentoDias,
      taxaCapitalPct,
      discountPct,
      notes,
      projectDays,
      materialItems: materialItems.map((i) => ({
        materialId: i.materialId,
        quantity: i.quantity,
        measures: i.measures.length
          ? i.measures.map((m) => ({ lengthM: parseFloat(m.lengthM) || 0, pieces: parseInt(m.pieces, 10) || 0 }))
          : undefined,
      })),
      laborItems,
      travelItems,
      otherItems,
      compositionItems,
      serviceItems,
      rentalItems,
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
            <p className="text-xs text-warning">Nenhum cliente cadastrado ainda.</p>
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
        <Label>Funcionário Responsável (opcional)</Label>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger>
            <SelectValue placeholder="Nenhum">
              {employees.find((e) => e.id === employeeId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* SERVICOS COMPOSTOS (CPU) */}
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Serviços Compostos (CPU)</Label>
          <Button type="button" size="sm" variant="outline" onClick={() =>
            setCompositionItems([...compositionItems, { compositionId: '', quantity: 1 }])
          }><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {compositionItems.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum serviço composto adicionado.</p>
        )}
        {compositionItems.map((item, idx) => {
          const selected = compositions.find((c) => c.id === item.compositionId);
          return (
            <div key={idx} className="flex gap-2 items-center">
              <Select value={item.compositionId} onValueChange={(v) => {
                const arr = [...compositionItems]; arr[idx].compositionId = v; setCompositionItems(arr);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o serviço">
                    {selected ? `${selected.name} (${fmt(selected.costs.unitCost)}/${selected.unit})` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {compositions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({fmt(c.costs.unitCost)}/{c.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" min="0.01" className="w-28" placeholder="Qtd." value={item.quantity}
                onChange={(e) => { const arr = [...compositionItems]; arr[idx].quantity = parseFloat(e.target.value) || 0; setCompositionItems(arr); }} />
              <span className="w-24 text-sm text-muted-foreground text-right">{fmt(compositionCost(item.compositionId, item.quantity))}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setCompositionItems(compositionItems.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
        {compositions.length === 0 && (
          <p className="text-xs text-warning">Nenhuma composição cadastrada ainda — cadastre em &quot;Custos &gt; Composições&quot;.</p>
        )}
      </div>

      {/* MATERIAIS */}
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Materiais</Label>
          <Button type="button" size="sm" variant="outline" onClick={() =>
            setMaterialItems([...materialItems, { materialId: '', quantity: 1, measures: [] }])
          }><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {materialItems.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum material adicionado.</p>
        )}
        {materialItems.length > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground font-medium px-1">
            <span className="flex-1">Material</span>
            <span className="w-28">Quantidade</span>
            <span className="w-24">Subtotal</span>
            <span className="w-16"></span>
          </div>
        )}
        {materialItems.map((item, idx) => {
          const selected = materials.find((m) => m.id === item.materialId);
          const hasMeasures = item.measures.length > 0;
          const effectiveQty = hasMeasures ? measuresTotal(item.measures) : item.quantity;

          function updateMeasures(measures: MaterialMeasureDraft[]) {
            const arr = [...materialItems];
            arr[idx] = { ...arr[idx], measures, quantity: measures.length ? measuresTotal(measures) : arr[idx].quantity };
            setMaterialItems(arr);
          }

          return (
            <div key={idx} className="border rounded-md p-2 space-y-2">
              <div className="flex gap-2 items-center">
                <Select value={item.materialId} onValueChange={(v) => {
                  const arr = [...materialItems]; arr[idx].materialId = v ?? ''; setMaterialItems(arr);
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
                <Input type="number" step="0.01" min="0.01" className="w-28" placeholder="Qtd." value={effectiveQty}
                  disabled={hasMeasures} title={hasMeasures ? 'Quantidade calculada a partir das medidas de corte' : undefined}
                  onChange={(e) => { const arr = [...materialItems]; arr[idx].quantity = parseFloat(e.target.value) || 0; setMaterialItems(arr); }} />
                <span className="w-24 text-sm text-muted-foreground text-right">{fmt(materialCost(item.materialId, effectiveQty))}</span>
                <Button type="button" size="icon" variant={hasMeasures ? 'default' : 'ghost'} title="Medidas de corte"
                  onClick={() => updateMeasures(hasMeasures ? item.measures : [{ lengthM: '', pieces: '1' }])}>
                  <Ruler size={16} />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => setMaterialItems(materialItems.filter((_, i) => i !== idx))}>
                  <Trash2 size={16} />
                </Button>
              </div>

              {hasMeasures && (
                <div className="pl-2 space-y-1.5 border-l-2 border-muted ml-1">
                  <div className="flex gap-2 text-[10px] uppercase tracking-wide text-muted-foreground font-medium px-1">
                    <span className="w-28">Comprimento (m)</span><span className="w-24">Peças</span><span className="flex-1">Total</span><span className="w-9"></span>
                  </div>
                  {item.measures.map((m, mi) => (
                    <div key={mi} className="flex gap-2 items-center">
                      <Input type="number" step="0.001" min="0.001" className="w-28" placeholder="Ex: 1,50" value={m.lengthM}
                        onChange={(e) => { const arr = [...item.measures]; arr[mi] = { ...arr[mi], lengthM: e.target.value }; updateMeasures(arr); }} />
                      <Input type="number" step="1" min="1" className="w-24" placeholder="Qtd." value={m.pieces}
                        onChange={(e) => { const arr = [...item.measures]; arr[mi] = { ...arr[mi], pieces: e.target.value }; updateMeasures(arr); }} />
                      <span className="flex-1 text-sm text-muted-foreground">
                        {((parseFloat(m.lengthM) || 0) * (parseInt(m.pieces, 10) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m
                      </span>
                      <Button type="button" size="icon" variant="ghost" onClick={() => updateMeasures(item.measures.filter((_, i) => i !== mi))}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2 items-center">
                    <Button type="button" size="sm" variant="outline" onClick={() => updateMeasures([...item.measures, { lengthM: '', pieces: '1' }])}>
                      <Plus size={12} className="mr-1" />Medida
                    </Button>
                    <span className="text-xs text-muted-foreground">Total do item: <strong>{effectiveQty.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m</strong></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {materials.length === 0 && (
          <p className="text-xs text-warning">Nenhum material cadastrado ainda — cadastre em "Materiais" primeiro.</p>
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
          <p className="text-sm text-muted-foreground">Nenhuma mão de obra adicionada.</p>
        )}
        {laborItems.length > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground font-medium px-1">
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
              <span className="w-24 text-sm text-muted-foreground text-right">{fmt(laborCost(item.laborRoleId, item.hours))}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setLaborItems(laborItems.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
        {laborRoles.length === 0 && (
          <p className="text-xs text-warning">Nenhuma função cadastrada ainda — cadastre em "Mão de Obra" primeiro.</p>
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
          <p className="text-sm text-muted-foreground">Nenhum deslocamento adicionado.</p>
        )}
        {travelItems.length > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground font-medium px-1 flex-wrap">
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
              <span className="w-24 text-sm text-muted-foreground text-right">{fmt(travelCost(item))}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setTravelItems(travelItems.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">Distância é só de ida — o sistema calcula ida e volta automaticamente.</p>
        {vehicles.length === 0 && (
          <p className="text-xs text-warning">Nenhum veículo cadastrado ainda — cadastre em "Veículos" primeiro.</p>
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
          <p className="text-sm text-muted-foreground">Nenhum custo extra adicionado.</p>
        )}
        {otherItems.length > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground font-medium px-1">
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

      {/* SERVICOS DE TERCEIROS */}
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Serviços de Terceiros</Label>
          <Button type="button" size="sm" variant="outline" onClick={() =>
            setServiceItems([...serviceItems, { thirdPartyServiceId: '', quantity: 1 }])
          }><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {serviceItems.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum serviço de terceiro adicionado.</p>
        )}
        {serviceItems.length > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground font-medium px-1">
            <span className="flex-1">Serviço</span>
            <span className="w-28">Quantidade</span>
            <span className="w-24">Subtotal</span>
            <span className="w-9"></span>
          </div>
        )}
        {serviceItems.map((item, idx) => {
          const selected = thirdPartyServices.find((s) => s.id === item.thirdPartyServiceId);
          return (
            <div key={idx} className="flex gap-2 items-center">
              <Select value={item.thirdPartyServiceId} onValueChange={(v) => {
                const arr = [...serviceItems]; arr[idx].thirdPartyServiceId = v; setServiceItems(arr);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o serviço">
                    {selected ? `${selected.name} (${fmt(selected.unitPrice)}/${selected.unit})` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {thirdPartyServices.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({fmt(s.unitPrice)}/{s.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" min="0.01" className="w-28" placeholder="Qtd." value={item.quantity}
                onChange={(e) => { const arr = [...serviceItems]; arr[idx].quantity = parseFloat(e.target.value) || 0; setServiceItems(arr); }} />
              <span className="w-24 text-sm text-muted-foreground text-right">{fmt(serviceCost(item.thirdPartyServiceId, item.quantity))}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setServiceItems(serviceItems.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
        {thirdPartyServices.length === 0 && (
          <p className="text-xs text-warning">Nenhum serviço cadastrado ainda — cadastre em &quot;Serviços de Terceiros&quot; primeiro.</p>
        )}
      </div>

      {/* ALUGUEIS E LOCACOES */}
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Aluguéis e Locações</Label>
          <Button type="button" size="sm" variant="outline" onClick={() =>
            setRentalItems([...rentalItems, { rentalEquipmentId: '', period: 1 }])
          }><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {rentalItems.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum aluguel adicionado.</p>
        )}
        {rentalItems.length > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground font-medium px-1">
            <span className="flex-1">Equipamento</span>
            <span className="w-28">Período</span>
            <span className="w-24">Subtotal</span>
            <span className="w-9"></span>
          </div>
        )}
        {rentalItems.map((item, idx) => {
          const selected = rentalEquipment.find((r) => r.id === item.rentalEquipmentId);
          return (
            <div key={idx} className="flex gap-2 items-center">
              <Select value={item.rentalEquipmentId} onValueChange={(v) => {
                const arr = [...rentalItems]; arr[idx].rentalEquipmentId = v; setRentalItems(arr);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o equipamento">
                    {selected ? `${selected.name} (${fmt(selected.unitPrice)})` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {rentalEquipment.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({fmt(r.unitPrice)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" step="1" min="1" className="w-28" placeholder="Período" value={item.period}
                onChange={(e) => { const arr = [...rentalItems]; arr[idx].period = parseInt(e.target.value, 10) || 0; setRentalItems(arr); }} />
              <span className="w-24 text-sm text-muted-foreground text-right">{fmt(rentalCost(item.rentalEquipmentId, item.period))}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setRentalItems(rentalItems.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
        {rentalEquipment.length === 0 && (
          <p className="text-xs text-warning">Nenhum equipamento cadastrado ainda — cadastre em &quot;Aluguéis e Locações&quot; primeiro.</p>
        )}
      </div>

      {/* REGIME / PRAZO / DESCONTO */}
      <div className="grid grid-cols-4 gap-4">
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
          <Label>Prazo (dias úteis)</Label>
          <Input type="number" min="0" step="0.5" value={projectDays} onChange={(e) => setProjectDays(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label>Desconto (%)</Label>
          <Input type="number" step="0.5" value={discountPct} onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      {/* FORMACAO DE PRECO (GROSS-UP) */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Margem de lucro desejada (%)</Label>
          <Input type="number" step="0.5" value={lucroPct} onChange={(e) => setLucroPct(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label>Contingência (%)</Label>
          <Input type="number" step="0.5" value={contingenciaPct} onChange={(e) => setContingenciaPct(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label>Prazo médio de recebimento (dias)</Label>
          <Input type="number" min="0" step="1" value={prazoRecebimentoDias} onChange={(e) => setPrazoRecebimentoDias(parseInt(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label>Taxa de capital ao mês (%)</Label>
          <Input type="number" step="0.1" value={taxaCapitalPct} onChange={(e) => setTaxaCapitalPct(parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input placeholder="Prazo de execução, forma de pagamento, garantia..." value={notes}
          onChange={(e) => setNotes(e.target.value)} />
      </div>

      {/* RESUMO */}
      <div className="bg-muted rounded-md p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Custo direto (materiais + mão de obra + deslocamento + serviços + aluguéis + outros)</span><span>{fmt(subtotal)}</span></div>
        {indirectCostValue > 0 && (
          <div className="flex justify-between text-warning"><span>Custos Indiretos (taxa administrativa)</span><span>{fmt(indirectCostValue)}</span></div>
        )}
        {contingenciaValue > 0 && (
          <div className="flex justify-between"><span>Contingência ({contingenciaPct}%)</span><span>{fmt(contingenciaValue)}</span></div>
        )}
        {custoFinanceiroValue > 0 && (
          <div className="flex justify-between"><span>Custo financeiro (prazo de recebimento)</span><span>{fmt(custoFinanceiroValue)}</span></div>
        )}
        <div className="flex justify-between font-medium"><span>Custo total</span><span>{fmt(custoTotal)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Impostos ({impostoPct}% do preço)</span><span>{fmt(impostoReal)}</span></div>
        <div className="flex justify-between text-destructive"><span>Desconto ({discountPct}%)</span><span>- {fmt(discountValue)}</span></div>
        <div className="flex justify-between font-bold text-lg border-t border-border pt-2 mt-2"><span>Preço de Venda (estimado)</span><span className="font-mono">{fmt(total)}</span></div>
        <div className="flex justify-between items-center pt-2">
          <span>Margem Estimada</span>
          <span className="flex items-center gap-2">
            <span className="font-semibold font-mono">{fmt(estimatedMargin)} ({estimatedMarginPct.toFixed(1)}%)</span>
            <Badge variant={marginBadgeVariant(estimatedMarginPct, marginHealthyPct, marginWarningPct)}>
              {marginLabel(estimatedMarginPct, marginHealthyPct, marginWarningPct)}
            </Badge>
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border mt-1">
          <span>Conferência: custo + imposto + lucro</span>
          <span className="font-mono">{fmt(custoTotal)} + {fmt(impostoReal)} + {fmt(estimatedMargin)} = {fmt(custoTotal + impostoReal + estimatedMargin)}</span>
        </div>
        {pricingImpossible && (
          <p className="text-xs text-destructive mt-1">⚠️ Margem de lucro + impostos somam 98% ou mais do preço — não é matematicamente possível atingir a margem desejada. Reduza a margem ou revise o regime tributário.</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Salvando...' : 'Salvar Orçamento'}
      </Button>
    </form>
  );
}