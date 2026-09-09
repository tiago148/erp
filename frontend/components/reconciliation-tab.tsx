'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Reconciliation } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const periodLabel: Record<string, string> = { mes: 'Este mês', '3m': 'Últimos 3 meses', ano: 'Este ano' };

export function ReconciliationTab() {
  const { token } = useAuth();
  const [period, setPeriod] = useState<'mes' | '3m' | 'ano'>('ano');
  const [data, setData] = useState<Reconciliation | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setData(await api.getReconciliation(token, period)); } finally { setLoading(false); }
  }, [token, period]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground max-w-3xl">
          <strong className="text-foreground">Duas visões que não devem ser somadas.</strong> Uma mostra o que a empresa
          <em> pagou</em> (caixa); a outra o que cada obra <em>consumiu</em> (gerencial). O rateio de indiretos e a mão de
          obra apontada não são despesa nova — são a forma de distribuir entre as obras o que já foi pago. Esta tela confere se as duas visões fecham.
        </p>
        <Select value={period} onValueChange={(v) => setPeriod((v as 'mes' | '3m' | 'ano') ?? 'ano')}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Este mês</SelectItem>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="ano">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading || !data ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-info/35 bg-info/5 p-4">
              <p className="text-[10px] uppercase tracking-wide font-bold text-info">A · Caixa</p>
              <p className="text-xs text-muted-foreground mt-1">O que efetivamente saiu do banco no período ({periodLabel[data.period]}): compras, folha, contas pagas, despesas.</p>
              <p className="text-2xl font-bold font-mono text-info mt-2">{fmt(data.caixa)}</p>
            </div>
            <div className="rounded-md border border-primary/35 bg-primary/5 p-4">
              <p className="text-[10px] uppercase tracking-wide font-bold text-primary">B · Gerencial</p>
              <p className="text-xs text-muted-foreground mt-1">O que foi alocado às obras: material requisitado, horas apontadas, deslocamento, rateio.</p>
              <p className="text-2xl font-bold font-mono text-primary mt-2">{fmt(data.gerencial)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border bg-card p-4">
              <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground mb-3">De caixa para gerencial</p>
              <div className="space-y-1.5 text-sm">
                {data.bridge.map((line, i) => (
                  <div key={i} className={`flex justify-between ${line.kind === 'total' ? 'border-t pt-2 mt-1 font-bold text-primary' : line.kind === 'base' ? 'font-semibold' : line.kind === 'warn' ? 'text-warning' : 'text-muted-foreground'}`}>
                    <span>{line.label}</span>
                    <span className="font-mono">{fmt(line.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md border bg-card p-4">
              <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground mb-3">Leitura</p>
              <p className="text-sm leading-relaxed">
                O caixa mostra o que saiu do banco; o gerencial, o que as obras consumiram. A diferença tem explicações
                legítimas: material comprado e ainda parado no estoque, estrutura que sai como despesa e volta às obras como
                rateio, depreciação que entra no rateio mas nunca sai do caixa.
                <br /><br />
                <span className={data.diffPct <= 30 ? 'text-success' : data.diffPct <= 60 ? 'text-warning' : 'text-destructive'}>
                  Diferença atual: {fmt(Math.abs(data.diff))} ({data.diffPct.toFixed(0)}% do caixa).
                </span>{' '}
                {data.diffPct > 60
                  ? 'Uma diferença muito grande costuma indicar apontamento incompleto — obras consumindo sem registro, ou despesa lançada sem vínculo.'
                  : 'Dentro do esperado para uma operação com estoque e estrutura.'}
              </p>
            </div>
          </div>

          <div className="rounded-md border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground mb-1">Auditoria de consistência</p>
            <p className="text-xs text-muted-foreground mb-3">Verificações automáticas que detectam lançamento em duplicidade e custo não alocado.</p>
            <div className="space-y-2">
              {data.audit.map((a, i) => (
                <div key={i} className={`flex gap-3 items-start rounded-md border p-3 text-sm ${a.level === 'erro' ? 'border-destructive/30 bg-destructive/5' : a.level === 'alerta' ? 'border-warning/30 bg-warning/5' : 'border-success/30 bg-success/5'}`}>
                  <span className="text-base shrink-0">{a.level === 'erro' ? '⛔' : a.level === 'alerta' ? '⚠' : '✓'}</span>
                  <div><strong>{a.title}</strong><br /><span className="text-muted-foreground">{a.detail}</span></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
