'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, ProjectFinancialAnalysis } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtMonth(month: string) {
  const [year, m] = month.split('-');
  return `${m}/${year.slice(2)}`;
}

function fmtMeses(v: number | null) {
  if (v === null) return 'Não recupera no período';
  return `${v.toFixed(1)} meses`;
}

interface Props {
  projectId: string;
}

export function ProjectFinancialAnalysisView({ projectId }: Props) {
  const { token } = useAuth();
  const [data, setData] = useState<ProjectFinancialAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [discountOverride, setDiscountOverride] = useState<string>('');

  const load = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    try {
      const pct = discountOverride ? parseFloat(discountOverride) : undefined;
      const result = await api.getProjectFinancialAnalysis(token, projectId, pct);
      setData(result);
      if (!discountOverride) setDiscountOverride(String(result.discountRatePct));
    } finally {
      setLoading(false);
    }
  }, [token, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  function handleSimulate() {
    if (!token) return;
    setLoading(true);
    const pct = discountOverride ? parseFloat(discountOverride) : undefined;
    api.getProjectFinancialAnalysis(token, projectId, pct).then(setData).finally(() => setLoading(false));
  }

  if (loading && !data) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!data) return null;

  const hasFlow = data.monthlyFlow.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">TMA anual (%)</Label>
          <Input type="number" step="0.1" className="w-32" value={discountOverride} onChange={(e) => setDiscountOverride(e.target.value)} />
        </div>
        <button type="button" onClick={handleSimulate} className="text-xs text-primary underline pb-2">
          Simular
        </button>
      </div>

      {!hasFlow ? (
        <p className="text-sm text-muted-foreground">Nenhuma movimentação financeira registrada para este projeto ainda — sem dados para calcular viabilidade.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">VPL</p>
              <p className={`font-mono text-lg font-semibold mt-1 ${data.vpl >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(data.vpl)}</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">TIR (ao mês / ano)</p>
              <p className="font-mono text-lg font-semibold mt-1">
                {data.tirMensalPct !== null ? `${data.tirMensalPct.toFixed(2)}%` : '—'} / {data.tirAnualPct !== null ? `${data.tirAnualPct.toFixed(1)}%` : '—'}
              </p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Índice de Lucratividade</p>
              <p className={`font-mono text-lg font-semibold mt-1 ${data.indiceLucratividade !== null && data.indiceLucratividade >= 1 ? 'text-success' : ''}`}>
                {data.indiceLucratividade !== null ? data.indiceLucratividade.toFixed(2) : '—'}
              </p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Payback Simples</p>
              <p className="font-mono text-sm font-semibold mt-1">{fmtMeses(data.paybackSimplesMeses)}</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Payback Descontado</p>
              <p className="font-mono text-sm font-semibold mt-1">{fmtMeses(data.paybackDescontadoMeses)}</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Exposição Máxima</p>
              <p className="font-mono text-lg font-semibold mt-1 text-destructive">{fmt(Math.abs(data.exposicaoMaxima))}</p>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">DRE Direto da Obra</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Receita realizada</span><span className="font-mono">{fmt(data.dre.receita)}</span></div>
              <div className="flex justify-between"><span>Custos diretos realizados</span><span className="font-mono">{fmt(data.dre.custosDiretos)}</span></div>
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>Resultado direto</span>
                <span className={`font-mono ${data.dre.resultadoDireto >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(data.dre.resultadoDireto)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Margem direta</span>
                <span className="font-mono">{data.dre.margemDiretaPct !== null ? `${data.dre.margemDiretaPct.toFixed(1)}%` : '—'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Curva de Saldo Acumulado</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.monthlyFlow}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e3138" />
                  <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: '#8b929e' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#8b929e' }} tickFormatter={(v) => fmt(v as number)} />
                  <Tooltip labelFormatter={(v) => fmtMonth(v as string)} formatter={(v) => fmt(v as number)} contentStyle={{ background: '#1e2026', border: '1px solid #2e3138', borderRadius: 8, color: '#d8dce6' }} />
                  <ReferenceLine y={0} stroke="#8b929e" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="cumulative" name="Saldo acumulado" stroke="#c8a96e" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead className="text-right">Saldo Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthlyFlow.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell>{fmtMonth(m.month)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(m.income)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(m.expense)}</TableCell>
                    <TableCell className={`text-right font-mono ${m.net >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(m.net)}</TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${m.cumulative >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(m.cumulative)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
