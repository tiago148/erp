'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, SocialChargeItem, BenefitItem } from '@/lib/api';
import { computeSocialCharges } from '@/lib/social-charges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function ItemRow<T extends { nome: string }>({
  item, valueKey, valueLabel, onChangeNome, onChangeValue, onRemove,
}: {
  item: T;
  valueKey: keyof T;
  valueLabel: string;
  onChangeNome: (v: string) => void;
  onChangeValue: (v: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <Input
        placeholder="Nome"
        value={item.nome}
        onChange={(e) => onChangeNome(e.target.value)}
        className="flex-1"
      />
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder={valueLabel}
        value={item[valueKey] as unknown as number}
        onChange={(e) => onChangeValue(parseFloat(e.target.value) || 0)}
        className="w-28"
      />
      <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

export function SocialChargesTab() {
  const { token } = useAuth();
  const [grupoA, setGrupoA] = useState<SocialChargeItem[]>([]);
  const [grupoB, setGrupoB] = useState<SocialChargeItem[]>([]);
  const [beneficios, setBeneficios] = useState<BenefitItem[]>([]);
  const [horasProdMes, setHorasProdMes] = useState(176);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const settings = await api.getSettings(token);
      setGrupoA(settings.encargosGrupoA ?? []);
      setGrupoB(settings.encargosGrupoB ?? []);
      setBeneficios(settings.encargosBeneficios ?? []);
      setHorasProdMes(settings.encargosHorasProdMes || 176);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const result = computeSocialCharges({ grupoA, grupoB, beneficios, horasProdMes });

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setMessage('');
    try {
      await api.updateSettings(token, {
        encargosGrupoA: grupoA,
        encargosGrupoB: grupoB,
        encargosBeneficios: beneficios,
        encargosHorasProdMes: horasProdMes,
      });
      setMessage('Configuração salva.');
    } finally {
      setSaving(false);
    }
  }

  async function handleApply() {
    if (!token) return;
    if (!confirm('Isso vai sobrescrever o percentual de encargos e o benefício/hora de TODAS as funções cadastradas. Continuar?')) return;
    setApplying(true);
    setMessage('');
    try {
      await api.updateSettings(token, {
        encargosGrupoA: grupoA,
        encargosGrupoB: grupoB,
        encargosBeneficios: beneficios,
        encargosHorasProdMes: horasProdMes,
      });
      const applied = await api.applySocialCharges(token);
      setMessage(`Aplicado a ${applied.affected} função(ões): encargos ${applied.encargosPct.toFixed(2)}% · benefício ${fmt(applied.beneficioHora)}/hora.`);
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Grupo A — Encargos Básicos (%)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">INSS, SESI, SENAI, INCRA, SEBRAE, Salário-Educação, RAT/SAT, FGTS...</p>
            {grupoA.map((item, idx) => (
              <ItemRow
                key={idx}
                item={item}
                valueKey="pct"
                valueLabel="%"
                onChangeNome={(v) => setGrupoA(grupoA.map((it, i) => i === idx ? { ...it, nome: v } : it))}
                onChangeValue={(v) => setGrupoA(grupoA.map((it, i) => i === idx ? { ...it, pct: v } : it))}
                onRemove={() => setGrupoA(grupoA.filter((_, i) => i !== idx))}
              />
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => setGrupoA([...grupoA, { nome: '', pct: 0 }])}>
              <Plus size={14} className="mr-1" />Adicionar item
            </Button>
            <div className="flex justify-between text-sm font-medium border-t pt-2 mt-2">
              <span>Subtotal Grupo A</span><span>{result.pctGrupoA.toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Grupo B — Provisões (%)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Férias, 13º salário, aviso prévio, multa FGTS...</p>
            {grupoB.map((item, idx) => (
              <ItemRow
                key={idx}
                item={item}
                valueKey="pct"
                valueLabel="%"
                onChangeNome={(v) => setGrupoB(grupoB.map((it, i) => i === idx ? { ...it, nome: v } : it))}
                onChangeValue={(v) => setGrupoB(grupoB.map((it, i) => i === idx ? { ...it, pct: v } : it))}
                onRemove={() => setGrupoB(grupoB.filter((_, i) => i !== idx))}
              />
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => setGrupoB([...grupoB, { nome: '', pct: 0 }])}>
              <Plus size={14} className="mr-1" />Adicionar item
            </Button>
            <div className="flex justify-between text-sm font-medium border-t pt-2 mt-2">
              <span>Subtotal Grupo B</span><span>{result.pctGrupoB.toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Benefícios (R$/mês por funcionário)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Vale-transporte, vale-refeição, seguro de vida, EPI (rateio), uniforme, exames, treinamentos NR...</p>
          {beneficios.map((item, idx) => (
            <ItemRow
              key={idx}
              item={item}
              valueKey="valorMes"
              valueLabel="R$/mês"
              onChangeNome={(v) => setBeneficios(beneficios.map((it, i) => i === idx ? { ...it, nome: v } : it))}
              onChangeValue={(v) => setBeneficios(beneficios.map((it, i) => i === idx ? { ...it, valorMes: v } : it))}
              onRemove={() => setBeneficios(beneficios.filter((_, i) => i !== idx))}
            />
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => setBeneficios([...beneficios, { nome: '', valorMes: 0 }])}>
            <Plus size={14} className="mr-1" />Adicionar item
          </Button>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Horas produtivas/mês</Label>
              <Input
                type="number"
                step="1"
                min="1"
                value={horasProdMes}
                onChange={(e) => setHorasProdMes(parseFloat(e.target.value) || 176)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <div className="flex justify-between text-sm"><span>Total Benefícios/mês</span><span>{fmt(result.beneficiosMes)}</span></div>
          <div className="flex justify-between text-sm"><span>Benefício/hora</span><span>{fmt(result.beneficioHora)}</span></div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>Encargos Sociais</span><span>{result.encargosPct.toFixed(2)}%</span>
          </div>
          {message && <p className="text-sm text-success">{message}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" disabled={saving} onClick={handleSave}>
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
            <Button type="button" disabled={applying} onClick={handleApply}>
              {applying ? 'Aplicando...' : 'Aplicar a Todas as Funções'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
