'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, PrevistoRealizado } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PrevistoRealizadoPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<PrevistoRealizado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.listPrevistoRealizadoPortfolio(token).then(setItems).finally(() => setLoading(false));
  }, [token]);

  const totalRevenuePlanned = items.reduce((s, i) => s + i.revenue.planned, 0);
  const totalRevenueActual = items.reduce((s, i) => s + i.revenue.actual, 0);
  const totalCostPlanned = items.reduce((s, i) => s + i.costs.total.planned, 0);
  const overBudgetCount = items.filter((i) => i.costs.total.status === 'ATENCAO').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Previsto x Realizado</h1>
        <p className="text-muted-foreground">Comparação entre o planejado nos orçamentos e o que de fato aconteceu em cada obra.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Receita Prevista</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(totalRevenuePlanned)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Receita Realizada</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(totalRevenueActual)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Custo Previsto</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(totalCostPlanned)}</p></CardContent>
        </Card>
        <Card className={overBudgetCount > 0 ? 'border-warning/40' : undefined}>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Obras Acima do Custo Previsto</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-warning">{overBudgetCount}</p><p className="text-xs text-muted-foreground">de {items.length} obra(s)</p></CardContent>
        </Card>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Obra</TableHead>
              <TableHead className="text-right">Receita Prevista</TableHead>
              <TableHead className="text-right">Receita Realizada</TableHead>
              <TableHead className="text-right">Custo Previsto</TableHead>
              <TableHead className="text-right">Custo Realizado</TableHead>
              <TableHead className="text-right">Margem Prevista</TableHead>
              <TableHead className="text-right">Margem Atual</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhuma obra com orçamento vinculado.</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.projectId}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/projetos/${item.projectId}`} className="hover:underline">
                    {item.number} — {item.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono">{fmt(item.revenue.planned)}</TableCell>
                <TableCell className="text-right font-mono">{fmt(item.revenue.actual)}</TableCell>
                <TableCell className="text-right font-mono">{fmt(item.costs.total.planned)}</TableCell>
                <TableCell className={`text-right font-mono ${item.costs.total.status === 'ATENCAO' ? 'text-destructive' : ''}`}>{fmt(item.costs.total.actual)}</TableCell>
                <TableCell className="text-right font-mono">{item.margin.plannedPct !== null ? `${item.margin.plannedPct.toFixed(1)}%` : '—'}</TableCell>
                <TableCell className="text-right font-mono">{item.margin.actualPct !== null ? `${item.margin.actualPct.toFixed(1)}%` : '—'}</TableCell>
                <TableCell>
                  {item.costs.total.status === 'ATENCAO' ? (
                    <Badge variant="warning">Custo acima</Badge>
                  ) : item.margin.diffPp !== null && item.margin.diffPp < 0 ? (
                    <Badge variant="warning">Margem abaixo</Badge>
                  ) : (
                    <Badge variant="success">Dentro do previsto</Badge>
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
