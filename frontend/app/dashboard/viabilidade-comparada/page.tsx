'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, ProjectFinancialAnalysis } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ViabilidadeComparadaPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ProjectFinancialAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.listProjectFinancialComparison(token).then(setItems).finally(() => setLoading(false));
  }, [token]);

  const withFlow = items.filter((i) => i.monthlyFlow.length > 0);
  const sorted = [...withFlow].sort((a, b) => b.vpl - a.vpl);
  const positiveVplCount = withFlow.filter((i) => i.vpl > 0).length;
  const maxExposureTotal = withFlow.reduce((s, i) => s + Math.abs(i.exposicaoMaxima), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Viabilidade Comparada</h1>
        <p className="text-muted-foreground">Ranking de obras por VPL, TIR e demais indicadores de viabilidade financeira, calculados a partir das movimentações reais.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Obras com VPL Positivo</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-success">{positiveVplCount}</p><p className="text-xs text-muted-foreground">de {withFlow.length} obra(s) com movimentação</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Capital de Giro Exigido (soma)</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(maxExposureTotal)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total de Obras</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{items.length}</p></CardContent>
        </Card>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Obra</TableHead>
              <TableHead className="text-right">VPL</TableHead>
              <TableHead className="text-right">TIR (ao ano)</TableHead>
              <TableHead className="text-right">Payback Simples</TableHead>
              <TableHead className="text-right">Exposição Máxima</TableHead>
              <TableHead className="text-right">Índice de Lucratividade</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : sorted.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma obra com movimentação financeira registrada ainda.</TableCell></TableRow>
            ) : sorted.map((item) => (
              <TableRow key={item.projectId}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/projetos/${item.projectId}`} className="hover:underline">
                    {item.number} — {item.name}
                  </Link>
                </TableCell>
                <TableCell className={`text-right font-mono ${item.vpl >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(item.vpl)}</TableCell>
                <TableCell className="text-right font-mono">{item.tirAnualPct !== null ? `${item.tirAnualPct.toFixed(1)}%` : '—'}</TableCell>
                <TableCell className="text-right font-mono">{item.paybackSimplesMeses !== null ? `${item.paybackSimplesMeses.toFixed(1)}m` : '—'}</TableCell>
                <TableCell className="text-right font-mono">{fmt(Math.abs(item.exposicaoMaxima))}</TableCell>
                <TableCell className="text-right font-mono">{item.indiceLucratividade !== null ? item.indiceLucratividade.toFixed(2) : '—'}</TableCell>
                <TableCell>
                  {item.vpl >= 0 ? (
                    <Badge variant="success">Viável</Badge>
                  ) : (
                    <Badge variant="warning">Atenção</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
