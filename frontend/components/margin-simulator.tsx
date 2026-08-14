'use client';

import { useState } from 'react';
import { Budget } from '@/lib/api';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function MarginSimulator({ budget }: { budget: Budget }) {
  const [discountPct, setDiscountPct] = useState(budget.discountPct);

  const { base, taxTotal, estimatedCost, total: originalTotal } = budget.totals;
  const newDiscountValue = (base + taxTotal) * (discountPct / 100);
  const newTotal = base + taxTotal - newDiscountValue;
  const newMargin = newTotal - estimatedCost;
  const newMarginPct = newTotal > 0 ? (newMargin / newTotal) * 100 : 0;
  const perda = originalTotal - newTotal;

  let maxDiscount = 0;
  for (let d = 0; d <= 60; d += 0.5) {
    const np = base + taxTotal - (base + taxTotal) * (d / 100);
    if (np - estimatedCost <= 0) { maxDiscount = d; break; }
    maxDiscount = d;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Orçamento #{budget.number} — {budget.client.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{budget.description}</p>
      </div>

      <div className="bg-muted rounded-md p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Custo total (direto + indireto)</span><span className="font-mono">{fmt(estimatedCost)}</span></div>
        <div className="flex justify-between font-bold border-t border-border pt-2 mt-2"><span>Preço atual</span><span className="font-mono">{fmt(originalTotal)}</span></div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Desconto a conceder</label>
          <span className="font-mono text-lg font-bold text-primary">{discountPct.toFixed(1)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={40}
          step={0.5}
          value={discountPct}
          onChange={(e) => setDiscountPct(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span><span>20%</span><span>40%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-secondary rounded-md p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Novo Preço</p>
          <p className="font-mono text-base font-semibold text-primary mt-1">{fmt(newTotal)}</p>
        </div>
        <div className="bg-secondary rounded-md p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lucro Líquido</p>
          <p className={`font-mono text-base font-semibold mt-1 ${newMargin > 0 ? 'text-success' : 'text-destructive'}`}>{fmt(newMargin)}</p>
        </div>
        <div className="bg-secondary rounded-md p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Margem</p>
          <p className={`font-mono text-base font-semibold mt-1 ${newMarginPct >= 15 ? 'text-success' : newMarginPct >= 5 ? 'text-warning' : 'text-destructive'}`}>{newMarginPct.toFixed(1)}%</p>
        </div>
      </div>

      <div className={`rounded-md p-3 text-xs leading-relaxed ${newMargin <= 0 ? 'bg-destructive/10 text-destructive' : newMarginPct < 8 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
        {newMargin <= 0 ? (
          <>🔴 <strong>Prejuízo.</strong> Com {discountPct.toFixed(1)}% de desconto você paga {fmt(-newMargin)} para executar essa obra. O desconto máximo antes de zerar o lucro é <strong>{maxDiscount.toFixed(1)}%</strong>.</>
        ) : newMarginPct < 8 ? (
          <>🟡 <strong>Margem apertada.</strong> {newMarginPct.toFixed(1)}% não cobre imprevisto de obra. Desconto máximo teórico: <strong>{maxDiscount.toFixed(1)}%</strong>, mas o recomendável é não passar de {Math.max(0, maxDiscount - 10).toFixed(0)}%.</>
        ) : (
          <>✅ <strong>Margem saudável.</strong> Você abre mão de {fmt(perda)} e ainda fica com {fmt(newMargin)} de lucro. Espaço até zerar: <strong>{maxDiscount.toFixed(1)}%</strong>.</>
        )}
      </div>
    </div>
  );
}
