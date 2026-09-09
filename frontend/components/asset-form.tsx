'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Asset, AssetInput } from '@/lib/api';

interface AssetFormProps {
  initialData?: Asset;
  onSubmit: (data: AssetInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: AssetInput = {
  name: '',
  category: '',
  acquisitionValue: 0,
  acquisitionDate: new Date().toISOString().slice(0, 10),
  usefulLifeMonths: 60,
  residualValue: 0,
  absorptionMode: 'INDIRECT',
  productiveHoursPerYear: 1200,
  annualMaintenance: 0,
  operatingCostPerHour: 0,
  notes: '',
};

const absorptionHint: Record<string, string> = {
  INDIRECT: 'Rateio da estrutura — diluído em todas as obras pela taxa administrativa. Use para barracão, móveis, informática e veículo administrativo.',
  HOURLY: 'Custo direto por hora de uso na obra. Use para máquina de porte que dá para apropriar: calandra, guilhotina, pórtico, máquina de solda grande.',
  TOOLING: 'Encargo complementar em R$/hora somado à mão de obra. Use para ferramenta manual e elétrica de uso individual.',
};

export function AssetForm({ initialData, onSubmit, onCancel }: AssetFormProps) {
  const [form, setForm] = useState<AssetInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        category: initialData.category || '',
        acquisitionValue: initialData.acquisitionValue,
        acquisitionDate: initialData.acquisitionDate.slice(0, 10),
        usefulLifeMonths: initialData.usefulLifeMonths,
        residualValue: initialData.residualValue,
        absorptionMode: initialData.absorptionMode,
        productiveHoursPerYear: initialData.productiveHoursPerYear,
        annualMaintenance: initialData.annualMaintenance,
        operatingCostPerHour: initialData.operatingCostPerHour,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  function updateField<K extends keyof AssetInput>(field: K, value: AssetInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar patrimônio');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Bem</Label>
          <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ex: Caminhão Munck, Betoneira" required />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input value={form.category} onChange={(e) => updateField('category', e.target.value)} placeholder="Ex: Veículo, Ferramenta, Equipamento" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor de Aquisição (R$)</Label>
          <Input type="number" step="0.01" min="0" value={form.acquisitionValue} onChange={(e) => updateField('acquisitionValue', parseFloat(e.target.value) || 0)} required />
        </div>
        <div className="space-y-2">
          <Label>Data de Aquisição</Label>
          <Input type="date" value={form.acquisitionDate} onChange={(e) => updateField('acquisitionDate', e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vida Útil (meses)</Label>
          <Input type="number" min="1" value={form.usefulLifeMonths} onChange={(e) => updateField('usefulLifeMonths', parseInt(e.target.value) || 1)} required />
        </div>
        <div className="space-y-2">
          <Label>Valor Residual (R$)</Label>
          <Input type="number" step="0.01" min="0" value={form.residualValue} onChange={(e) => updateField('residualValue', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Forma de absorção no preço</Label>
        <Select value={form.absorptionMode} onValueChange={(v) => updateField('absorptionMode', (v as AssetInput['absorptionMode']) ?? 'INDIRECT')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="INDIRECT">Indireto — rateio da estrutura</SelectItem>
            <SelectItem value="HOURLY">Custo horário — por hora de uso na obra</SelectItem>
            <SelectItem value="TOOLING">Encargo complementar — ferramenta/EPI individual</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{absorptionHint[form.absorptionMode]}</p>
      </div>

      {form.absorptionMode === 'HOURLY' && (
        <div className="grid grid-cols-3 gap-4 rounded-md border p-3">
          <div className="space-y-2">
            <Label className="text-xs">Horas produtivas/ano</Label>
            <Input type="number" min="1" value={form.productiveHoursPerYear} onChange={(e) => updateField('productiveHoursPerYear', parseInt(e.target.value) || 1200)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Manutenção anual (R$)</Label>
            <Input type="number" step="0.01" min="0" value={form.annualMaintenance} onChange={(e) => updateField('annualMaintenance', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Operação por hora (R$)</Label>
            <Input type="number" step="0.01" min="0" value={form.operatingCostPerHour} onChange={(e) => updateField('operatingCostPerHour', parseFloat(e.target.value) || 0)} />
          </div>
          {initialData && (
            <p className="col-span-3 text-xs font-mono text-primary">
              Custo horário atual: {initialData.hourlyMachineCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/h
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
