'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import {
  ROTEIRO, GRAUS, itemKey, totalRoteiroItems, phaseProgress, calcRoteiro,
} from '@/lib/budget-roteiro';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  budgetId: string;
  token: string;
  onSaved?: () => void;
}

export function BudgetRoteiro({ budgetId, token, onSaved }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [infoLevel, setInfoLevel] = useState<'exec' | 'basico' | 'croqui'>('basico');
  const [siteVisitDone, setSiteVisitDone] = useState(false);
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([1]));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.getBudgetRoteiro(token, budgetId).then((r) => {
      if (!alive) return;
      if (r) {
        setChecked(new Set(r.checkedKeys));
        setInfoLevel(r.infoLevel);
        setSiteVisitDone(r.siteVisitDone);
      } else {
        setChecked(new Set());
        setInfoLevel('basico');
        setSiteVisitDone(false);
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [budgetId, token]);

  const calc = useMemo(
    () => calcRoteiro([...checked], infoLevel, siteVisitDone),
    [checked, infoLevel, siteVisitDone],
  );
  const total = totalRoteiroItems();

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function togglePhase(n: number) {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSavedMsg('');
    try {
      await api.saveBudgetRoteiro(token, budgetId, {
        checkedKeys: [...checked],
        infoLevel,
        siteVisitDone,
        completionPct: Number(calc.completionPct.toFixed(2)),
        suggestedContingencyPct: calc.suggestedContingencyPct,
      });
      setSavedMsg(`Roteiro salvo — contingência sugerida ${calc.suggestedContingencyPct.toFixed(1)}%`);
      onSaved?.();
    } catch (err) {
      setSavedMsg(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-md border-l-2 border-primary bg-muted/40 p-3 text-xs leading-relaxed">
        <strong className="text-primary">O método completo em 9 etapas.</strong> Marque conforme avança. O percentual de
        completude fica salvo junto com o orçamento — dá para ver de longe qual proposta foi levantada com cuidado.
      </div>

      <div className="rounded-md border bg-gradient-to-br from-primary/10 to-transparent p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Completude do levantamento</p>
            <p className="text-3xl font-bold font-mono text-primary">{calc.completionPct.toFixed(0)}%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Contingência sugerida</p>
            <p className="text-3xl font-bold font-mono text-warning">{calc.suggestedContingencyPct.toFixed(1)}%</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-3">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${calc.completionPct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{calc.diagnostic}</p>
      </div>

      <div className="rounded-md border bg-card p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Grau de detalhamento da informação</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {GRAUS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setInfoLevel(g.id)}
              className={`rounded-md border p-3 text-left transition ${infoLevel === g.id ? 'border-primary bg-primary/10' : 'hover:border-border'}`}
            >
              <div className="font-mono text-lg font-bold text-primary">{g.min}–{g.max}%</div>
              <div className="text-xs font-semibold mt-1">{g.label}</div>
              <div className="text-[11px] text-muted-foreground">{g.desc}</div>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input type="checkbox" className="size-4 accent-primary" checked={siteVisitDone} onChange={(e) => setSiteVisitDone(e.target.checked)} />
          Visita técnica ao local foi realizada
        </label>
      </div>

      <div className="space-y-2">
        {ROTEIRO.map((fase) => {
          const pct = phaseProgress(fase, checked);
          const isOpen = openPhases.has(fase.n);
          return (
            <div key={fase.n} className="rounded-md border bg-card overflow-hidden">
              <button type="button" onClick={() => togglePhase(fase.n)} className="flex w-full items-center gap-3 p-3 text-left">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-sm font-bold ${pct >= 100 ? 'bg-success/15 text-success' : 'bg-muted text-primary'}`}>
                  {pct >= 100 ? '✓' : fase.n}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{fase.t}</span>
                  <span className="block text-xs text-muted-foreground">{fase.d}</span>
                </span>
                <span className={`font-mono text-xs ${pct >= 100 ? 'text-success' : pct > 0 ? 'text-warning' : 'text-muted-foreground'}`}>{pct.toFixed(0)}%</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isOpen && (
                <div className="border-t px-4 pb-3">
                  {fase.grupos.map((grupo, gi) => (
                    <div key={gi}>
                      <p className="text-[10px] uppercase tracking-wide font-bold text-primary/80 mt-3 mb-1.5">{grupo.g}</p>
                      {grupo.itens.map((item, ii) => {
                        const key = itemKey(fase.n, gi, ii);
                        const on = checked.has(key);
                        return (
                          <label key={key} className={`flex items-start gap-2.5 py-1.5 text-sm cursor-pointer ${on ? 'text-muted-foreground line-through' : ''}`}>
                            <input type="checkbox" className="mt-0.5 size-4 accent-primary shrink-0" checked={on} onChange={() => toggle(key)} />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{checked.size} de {total} verificações marcadas</p>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-xs text-success">{savedMsg}</span>}
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Roteiro'}</Button>
        </div>
      </div>
    </div>
  );
}
