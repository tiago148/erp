'use client';

import { useMemo, useState } from 'react';
import { CyclicCountPlan, CyclicCountPlanItem, CyclicCountInput, Employee } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Cls = 'A' | 'B' | 'C' | 'D';

interface Props {
  plan: CyclicCountPlan;
  employees: Employee[];
  onSubmit: (data: CyclicCountInput) => Promise<void>;
  onCancel: () => void;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export function CyclicCountForm({ plan, employees, onSubmit, onCancel }: Props) {
  const [countDate, setCountDate] = useState(new Date().toISOString().slice(0, 10));
  const [responsibleId, setResponsibleId] = useState('');
  const [cls, setCls] = useState<Cls>('A');
  const [count, setCount] = useState('5');
  const [seed, setSeed] = useState(0);
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pool = plan.buckets[cls] ?? [];

  const list = useMemo(() => {
    const sorted = [...pool].sort((a, b) => {
      const ua = a.lastCountDate ?? '0000-01-01';
      const ub = b.lastCountDate ?? '0000-01-01';
      return ua.localeCompare(ub);
    });
    const n = count === 'all' ? sorted.length : parseInt(count) || 5;
    return sorted.slice(0, n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls, count, seed, plan]);

  function regenerate() {
    setRevealed(false);
    setCounted({});
    setSeed((s) => s + 1);
  }

  function tolerance(itemCls: string) {
    return plan.tolerances[(itemCls === 'D' ? 'A' : itemCls) as 'A' | 'B' | 'C'] ?? 5;
  }

  function rowStats(item: CyclicCountPlanItem) {
    const c = parseFloat(counted[item.id] ?? '');
    if (Number.isNaN(c)) return null;
    const diff = c - item.systemQty;
    const diffPct = item.systemQty > 0 ? (Math.abs(diff) / item.systemQty) * 100 : diff !== 0 ? 100 : 0;
    return { diff, diffPct, tol: tolerance(item.className) };
  }

  const summary = useMemo(() => {
    if (!revealed) return null;
    let correct = 0;
    let divergent = 0;
    let adjustment = 0;
    const critical: string[] = [];
    const above: string[] = [];
    for (const it of list) {
      const s = rowStats(it);
      if (!s) continue;
      if (Math.abs(s.diff) < 0.001) correct++;
      else {
        divergent++;
        adjustment += s.diff * it.unitCost;
        if (s.diffPct > s.tol) above.push(it.name);
        if (s.diffPct > s.tol * 2) critical.push(it.name);
      }
    }
    const accuracy = list.length ? (correct / list.length) * 100 : 0;
    const target = cls === 'D' ? 95 : plan.targets[cls as 'A' | 'B' | 'C'];
    return { correct, divergent, adjustment, accuracy, target, critical, above };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, counted, list, cls]);

  function reveal() {
    const missing = list.filter((it) => (counted[it.id] ?? '') === '').length;
    if (missing) { setError(`${missing} item(ns) sem contagem lançada.`); return; }
    setError('');
    setRevealed(true);
  }

  async function handleSave() {
    if (!revealed) { setError('Revele os saldos e confira antes de salvar.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        countDate,
        className: cls,
        responsibleId: responsibleId || undefined,
        items: list.map((it) => ({ stockItemId: it.id, countedQty: parseFloat(counted[it.id]) || 0 })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar contagem');
      setSaving(false);
    }
  }

  const classCards: { key: Cls; label: string; n: number; color: string }[] = [
    { key: 'A', label: 'Classe A · mensal', n: plan.buckets.A.length, color: 'text-destructive' },
    { key: 'B', label: 'Classe B · trimestral', n: plan.buckets.B.length, color: 'text-warning' },
    { key: 'C', label: 'Classe C · semestral', n: plan.buckets.C.length, color: 'text-muted-foreground' },
    { key: 'D', label: 'Vencidos', n: plan.buckets.D.length, color: 'text-primary' },
  ];

  return (
    <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
      <div className="rounded-md border-l-2 border-primary bg-muted/40 p-3 text-xs leading-relaxed">
        <strong className="text-primary">Contagem cega.</strong> O sistema não mostra o saldo enquanto você conta —
        o saldo aparece só depois que você lança o contado e clica em revelar. Tolerância de divergência: A 2% · B 3% · C 5%.
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Data</Label>
          <Input type="date" value={countDate} onChange={(e) => setCountDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Responsável</Label>
          <Select value={responsibleId} onValueChange={(v) => setResponsibleId(v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Qtd. de itens</Label>
          <Select value={count} onValueChange={(v) => { setCount(v ?? '5'); regenerate(); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 itens</SelectItem>
              <SelectItem value="10">10 itens</SelectItem>
              <SelectItem value="20">20 itens</SelectItem>
              <SelectItem value="all">Todos da classe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {classCards.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => { setCls(c.key); regenerate(); }}
            className={`rounded-md border p-2 text-center transition ${cls === c.key ? 'border-primary bg-primary/10' : 'hover:border-border'}`}
          >
            <div className={`font-mono text-lg font-bold ${c.color}`}>{c.n}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={regenerate}>↻ Gerar nova lista</Button>
        <Button type="button" size="sm" variant="outline" onClick={reveal} disabled={revealed || list.length === 0}>
          🔓 Revelar saldos e conferir
        </Button>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <div className="grid grid-cols-[28px_1fr_90px_60px_96px_120px] gap-2 bg-muted/50 px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>#</span><span>Item</span><span>Endereço</span><span>Un</span><span>Contado</span><span>Sistema / dif.</span>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y">
          {list.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhum item nesta classe.</p>
          ) : list.map((it, i) => {
            const s = revealed ? rowStats(it) : null;
            const diffColor = s
              ? s.diffPct === 0 ? 'text-muted-foreground'
                : s.diffPct <= s.tol ? 'text-success'
                : s.diffPct <= s.tol * 2 ? 'text-warning' : 'text-destructive font-semibold'
              : '';
            return (
              <div key={it.id} className="grid grid-cols-[28px_1fr_90px_60px_96px_120px] gap-2 px-3 py-2 items-center text-sm">
                <span className="text-muted-foreground font-mono">{i + 1}</span>
                <span>{it.name}</span>
                <span className="font-mono text-xs text-primary">{it.address || '—'}</span>
                <span className="text-muted-foreground">{it.unit}</span>
                <Input
                  className="h-8"
                  type="number"
                  step="0.01"
                  value={counted[it.id] ?? ''}
                  onChange={(e) => setCounted((c) => ({ ...c, [it.id]: e.target.value }))}
                />
                <span className="font-mono text-xs">
                  {revealed
                    ? <>{fmt(it.systemQty)} <span className={diffColor}>{s && `(${s.diff > 0 ? '+' : ''}${fmt(s.diff)})`}</span></>
                    : <span className="text-muted-foreground">oculto</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {summary && (
        <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Itens contados</span><span className="font-mono">{list.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Certos</span><span className="font-mono text-success">{summary.correct}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Divergentes</span><span className={`font-mono ${summary.divergent ? 'text-destructive' : 'text-muted-foreground'}`}>{summary.divergent}</span></div>
          <div className="flex justify-between border-t pt-1 font-semibold"><span>Acuracidade</span><span className={`font-mono ${summary.accuracy >= summary.target ? 'text-success' : summary.accuracy >= summary.target - 5 ? 'text-warning' : 'text-destructive'}`}>{summary.accuracy.toFixed(1)}% (meta {summary.target}%)</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Impacto financeiro do ajuste</span><span className={`font-mono ${summary.adjustment < 0 ? 'text-destructive' : 'text-success'}`}>{summary.adjustment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
          {summary.critical.length > 0 && (
            <p className="text-xs text-destructive">🔴 {summary.critical.length} item(ns) com divergência crítica: {summary.critical.join(', ')}. Reconte antes de salvar.</p>
          )}
          {summary.critical.length === 0 && summary.above.length > 0 && (
            <p className="text-xs text-warning">⚠ {summary.above.length} item(ns) acima da tolerância — não serão ajustados automaticamente.</p>
          )}
          {summary.divergent === 0 && <p className="text-xs text-success">✓ Contagem sem divergência.</p>}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="button" disabled={saving || !revealed} onClick={handleSave}>{saving ? 'Salvando...' : 'Salvar Contagem'}</Button>
      </div>
    </div>
  );
}
