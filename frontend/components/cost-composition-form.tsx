'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, CostComposition, CostCompositionInput, Material, LaborRole } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

interface Props {
  initialData?: CostComposition;
  onSubmit: (data: CostCompositionInput) => Promise<void>;
  onCancel: () => void;
}

const unitOptions = ['m', 'm2', 'm3', 'un', 'pç', 'cj', 'ponto', 'kg'];

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CostCompositionForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [materialsCatalog, setMaterialsCatalog] = useState<Material[]>([]);
  const [laborCatalog, setLaborCatalog] = useState<LaborRole[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [code, setCode] = useState(initialData?.code || '');
  const [name, setName] = useState(initialData?.name || '');
  const [unit, setUnit] = useState(initialData?.unit || unitOptions[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [materialLines, setMaterialLines] = useState(
    initialData?.materials.map((m) => ({ materialId: m.materialId, coefficient: m.coefficient })) || [],
  );
  const [laborLines, setLaborLines] = useState(
    initialData?.labor.map((l) => ({ laborRoleId: l.laborRoleId, hoursPerUnit: l.hoursPerUnit })) || [],
  );

  useEffect(() => {
    if (!token) return;
    api.listMaterials(token).then(setMaterialsCatalog);
    api.listLaborRoles(token).then(setLaborCatalog);
  }, [token]);

  function materialUnitCost(materialId: string) {
    return materialsCatalog.find((m) => m.id === materialId)?.unitCost ?? 0;
  }
  function laborEffectiveRate(laborRoleId: string) {
    return laborCatalog.find((r) => r.id === laborRoleId)?.effectiveHourlyRate ?? 0;
  }

  const materialCost = materialLines.reduce((s, l) => s + l.coefficient * materialUnitCost(l.materialId), 0);
  const laborCost = laborLines.reduce((s, l) => s + l.hoursPerUnit * laborEffectiveRate(l.laborRoleId), 0);
  const totalHours = laborLines.reduce((s, l) => s + l.hoursPerUnit, 0);
  const unitCost = materialCost + laborCost;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (materialLines.length === 0 && laborLines.length === 0) {
      setError('Adicione ao menos um material ou mão de obra.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        code: code || undefined,
        name,
        unit,
        description: description || undefined,
        materials: materialLines,
        labor: laborLines,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Código</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CPU-001" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Serviço</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Ex: Tubulação inox 2" soldada' required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Unidade</Label>
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger className="w-full"><SelectValue>{unit}</SelectValue></SelectTrigger>
          <SelectContent>
            {unitOptions.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Escopo do serviço..." />
      </div>

      {/* MATERIAIS POR UNIDADE */}
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Materiais por {unit}</Label>
          <Button type="button" size="sm" variant="outline" onClick={() =>
            setMaterialLines([...materialLines, { materialId: '', coefficient: 1 }])
          }><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {materialLines.length === 0 && <p className="text-sm text-muted-foreground">Nenhum material adicionado.</p>}
        {materialLines.map((line, idx) => {
          const selected = materialsCatalog.find((m) => m.id === line.materialId);
          return (
            <div key={idx} className="flex gap-2 items-center">
              <Select value={line.materialId} onValueChange={(v) => {
                const arr = [...materialLines]; arr[idx].materialId = v; setMaterialLines(arr);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o material">
                    {selected ? `${selected.name} (${fmt(selected.unitCost)}/${selected.unit})` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {materialsCatalog.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({fmt(m.unitCost)}/{m.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" step="0.0001" min="0.0001" className="w-28" placeholder="Coef." value={line.coefficient}
                onChange={(e) => { const arr = [...materialLines]; arr[idx].coefficient = parseFloat(e.target.value) || 0; setMaterialLines(arr); }} />
              <span className="w-24 text-sm text-muted-foreground text-right">{fmt(line.coefficient * materialUnitCost(line.materialId))}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setMaterialLines(materialLines.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
      </div>

      {/* MAO DE OBRA POR UNIDADE */}
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Mão de obra por {unit}</Label>
          <Button type="button" size="sm" variant="outline" onClick={() =>
            setLaborLines([...laborLines, { laborRoleId: '', hoursPerUnit: 1 }])
          }><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {laborLines.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mão de obra adicionada.</p>}
        {laborLines.map((line, idx) => {
          const selected = laborCatalog.find((r) => r.id === line.laborRoleId);
          return (
            <div key={idx} className="flex gap-2 items-center">
              <Select value={line.laborRoleId} onValueChange={(v) => {
                const arr = [...laborLines]; arr[idx].laborRoleId = v; setLaborLines(arr);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione a função">
                    {selected ? `${selected.name} (${fmt(selected.effectiveHourlyRate)}/h)` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {laborCatalog.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({fmt(r.effectiveHourlyRate)}/h)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" min="0.01" className="w-28" placeholder="Horas" value={line.hoursPerUnit}
                onChange={(e) => { const arr = [...laborLines]; arr[idx].hoursPerUnit = parseFloat(e.target.value) || 0; setLaborLines(arr); }} />
              <span className="w-24 text-sm text-muted-foreground text-right">{fmt(line.hoursPerUnit * laborEffectiveRate(line.laborRoleId))}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => setLaborLines(laborLines.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
      </div>

      {/* RESUMO */}
      <div className="bg-muted rounded-md p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Material / {unit}</span><span className="font-mono">{fmt(materialCost)}</span></div>
        <div className="flex justify-between"><span>Mão de obra / {unit}</span><span className="font-mono">{fmt(laborCost)}</span></div>
        <div className="flex justify-between font-bold border-t border-border pt-2 mt-2"><span>Custo por {unit}</span><span className="font-mono">{fmt(unitCost)}</span></div>
        {totalHours > 0 && (
          <p className="text-xs text-muted-foreground pt-1">{totalHours.toFixed(2)}h por {unit} · uma equipe de 3 produz ~{((8 * 3) / totalHours).toFixed(1)} {unit}/dia</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
