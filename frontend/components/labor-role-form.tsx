'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, LaborRole, LaborRoleInput } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { calculateLaborRoleEffectiveRate } from '@/lib/labor-rate';

interface LaborRoleFormProps {
  initialData?: LaborRole;
  onSubmit: (data: LaborRoleInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: LaborRoleInput = {
  name: '',
  hourlyRate: 0,
  chargesPct: 0,
  periculosidade: false,
  insalubridadePct: 0,
  noturnoPct: 0,
  beneficioHora: 0,
  ferramentalHora: 0,
};

const insalubridadeOptions = [
  { label: 'Nenhuma', value: 0 },
  { label: 'Grau mínimo (10%)', value: 10 },
  { label: 'Grau médio (20%)', value: 20 },
  { label: 'Grau máximo (40%)', value: 40 },
];

export function LaborRoleForm({ initialData, onSubmit, onCancel }: LaborRoleFormProps) {
  const { token } = useAuth();
  const [form, setForm] = useState<LaborRoleInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [salarioMinimo, setSalarioMinimo] = useState(1518);

  useEffect(() => {
    if (!token) return;
    api.getSettings(token).then((s) => setSalarioMinimo(s.salarioMinimo));
  }, [token]);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        hourlyRate: initialData.hourlyRate,
        chargesPct: initialData.chargesPct,
        periculosidade: initialData.periculosidade,
        insalubridadePct: initialData.insalubridadePct,
        noturnoPct: initialData.noturnoPct,
        beneficioHora: initialData.beneficioHora,
        ferramentalHora: initialData.ferramentalHora,
      });
    }
  }, [initialData]);

  function updateField<K extends keyof LaborRoleInput>(field: K, value: LaborRoleInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar função');
    } finally {
      setIsSubmitting(false);
    }
  }

  const rate = calculateLaborRoleEffectiveRate(
    {
      hourlyRate: form.hourlyRate || 0,
      chargesPct: form.chargesPct || 0,
      periculosidade: form.periculosidade || false,
      insalubridadePct: form.insalubridadePct || 0,
      noturnoPct: form.noturnoPct || 0,
      beneficioHora: form.beneficioHora || 0,
      ferramentalHora: form.ferramentalHora || 0,
    },
    salarioMinimo,
  );

  function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Função</Label>
        <Input
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Ex: Soldador, Ajudante, Encarregado"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Taxa/Hora Base (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.hourlyRate}
            onChange={(e) => updateField('hourlyRate', parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Encargos (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.chargesPct}
            onChange={(e) => updateField('chargesPct', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer hover:bg-muted w-fit">
          <input
            type="checkbox"
            checked={form.periculosidade}
            onChange={(e) => updateField('periculosidade', e.target.checked)}
          />
          Periculosidade (adicional de 30% sobre a hora-base)
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Insalubridade</Label>
          <div className="flex gap-3 flex-wrap">
            {insalubridadeOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted">
                <input
                  type="radio"
                  name="insalubridadePct"
                  checked={(form.insalubridadePct || 0) === opt.value}
                  onChange={() => updateField('insalubridadePct', opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Adicional Noturno (%)</Label>
          <Input
            type="number"
            step="1"
            min="0"
            value={form.noturnoPct}
            onChange={(e) => updateField('noturnoPct', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Benefício por Hora (R$)</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={form.beneficioHora}
          onChange={(e) => updateField('beneficioHora', parseFloat(e.target.value) || 0)}
        />
        <p className="text-xs text-muted-foreground">
          Vale-transporte, vale-refeição e demais benefícios, já convertidos para R$/hora. Normalmente preenchido em lote pela aba &quot;Encargos Sociais&quot;.
        </p>
      </div>

      <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
        <div className="flex justify-between"><span>Hora-base</span><span>{fmt(rate.baseRate)}</span></div>
        {rate.periculosidadeValue > 0 && (
          <div className="flex justify-between text-warning"><span>Periculosidade</span><span>{fmt(rate.periculosidadeValue)}</span></div>
        )}
        {rate.insalubridadeValue > 0 && (
          <div className="flex justify-between text-warning"><span>Insalubridade</span><span>{fmt(rate.insalubridadeValue)}</span></div>
        )}
        {rate.noturnoValue > 0 && (
          <div className="flex justify-between text-warning"><span>Adicional Noturno</span><span>{fmt(rate.noturnoValue)}</span></div>
        )}
        <div className="flex justify-between font-medium border-t border-border pt-1 mt-1"><span>Encargos ({form.chargesPct || 0}%)</span><span>{fmt(rate.rateWithAdditions * ((form.chargesPct || 0) / 100))}</span></div>
        {rate.beneficioHora > 0 && (
          <div className="flex justify-between"><span>Benefício/hora</span><span>{fmt(rate.beneficioHora)}</span></div>
        )}
        {rate.ferramentalHora > 0 && (
          <div className="flex justify-between"><span>Ferramental/hora (encargo complementar)</span><span>{fmt(rate.ferramentalHora)}</span></div>
        )}
        <div className="flex justify-between font-bold border-t border-border pt-2 mt-2">
          <span>Taxa/hora efetiva</span>
          <span>{fmt(rate.effectiveHourlyRate)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}