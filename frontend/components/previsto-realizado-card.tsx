'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, PrevistoRealizado, ComparisonRow, ComparisonStatus } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const statusLabels: Record<ComparisonStatus, string> = {
  DENTRO: 'Dentro do previsto',
  ATENCAO: 'Atenção',
  POSITIVO: 'Positivo',
};
const statusVariant: Record<ComparisonStatus, 'success' | 'warning' | 'danger'> = {
  DENTRO: 'success',
  POSITIVO: 'success',
  ATENCAO: 'warning',
};

function StatusBadge({ status }: { status: ComparisonStatus }) {
  return <Badge variant={statusVariant[status]}>{statusLabels[status]}</Badge>;
}

function PlannedOnlyRow({ label, planned }: { label: string; planned: number }) {
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell className="font-mono text-right">{fmt(planned)}</TableCell>
      <TableCell className="font-mono text-right text-muted-foreground">—</TableCell>
      <TableCell className="font-mono text-right text-muted-foreground">—</TableCell>
      <TableCell className="text-right text-muted-foreground">—</TableCell>
      <TableCell />
    </TableRow>
  );
}

function Row({ label, row, bold }: { label: string; row: ComparisonRow; bold?: boolean }) {
  return (
    <TableRow className={bold ? 'font-semibold border-t-2' : undefined}>
      <TableCell>{label}</TableCell>
      <TableCell className="font-mono text-right">{fmt(row.planned)}</TableCell>
      <TableCell className="font-mono text-right">{fmt(row.actual)}</TableCell>
      <TableCell className={`font-mono text-right ${row.diff > 0 ? 'text-destructive' : row.diff < 0 ? 'text-success' : ''}`}>
        {row.diff > 0 ? '+' : ''}{fmt(row.diff)}
      </TableCell>
      <TableCell className="text-right">{row.executionPct !== null ? `${row.executionPct.toFixed(0)}%` : '—'}</TableCell>
      <TableCell><StatusBadge status={row.status} /></TableCell>
    </TableRow>
  );
}

export function PrevistoRealizadoCard({ projectId }: { projectId: string }) {
  const { token } = useAuth();
  const [data, setData] = useState<PrevistoRealizado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !projectId) return;
    setLoading(true);
    api.getPrevistoRealizadoProject(token, projectId).then(setData).finally(() => setLoading(false));
  }, [token, projectId]);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Previsto x Realizado</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !data || !data.hasBudget ? (
          <p className="text-sm text-muted-foreground">Este projeto não possui orçamento vinculado — não há valores previstos para comparar.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold mb-2">Receita</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary rounded-md p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Previsto</p>
                  <p className="font-mono text-lg font-semibold mt-1">{fmt(data.revenue.planned)}</p>
                </div>
                <div className="bg-secondary rounded-md p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Realizado</p>
                  <p className="font-mono text-lg font-semibold mt-1">{fmt(data.revenue.actual)}</p>
                </div>
                <div className="bg-secondary rounded-md p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Diferença</p>
                  <p className={`font-mono text-lg font-semibold mt-1 ${data.revenue.diff >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {data.revenue.diff > 0 ? '+' : ''}{fmt(data.revenue.diff)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Execução: {data.revenue.executionPct !== null ? `${data.revenue.executionPct.toFixed(0)}%` : '—'}</span>
                <StatusBadge status={data.revenue.status} />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Custos</p>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Previsto</TableHead>
                      <TableHead className="text-right">Realizado</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                      <TableHead className="text-right">Execução</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <Row label="Materiais" row={data.costs.material} />
                    <Row label="Mão de obra" row={data.costs.labor} />
                    <Row label="Veículos" row={data.costs.vehicles} />
                    <Row label="Outros" row={data.costs.other} />
                    {data.costs.services.planned > 0 && (
                      <PlannedOnlyRow label="Serviços de Terceiros" planned={data.costs.services.planned} />
                    )}
                    {data.costs.rentals.planned > 0 && (
                      <PlannedOnlyRow label="Aluguéis e Locações" planned={data.costs.rentals.planned} />
                    )}
                    <Row label="Custo total" row={data.costs.total} bold />
                  </TableBody>
                </Table>
              </div>
              {(data.costs.services.planned > 0 || data.costs.rentals.planned > 0) && (
                <p className="text-xs text-muted-foreground mt-2">
                  Serviços de terceiros e aluguéis ainda não têm realizado rastreado separadamente — não entram no &quot;Custo total&quot; acima.
                </p>
              )}
            </div>

            <div className="border rounded-md p-3">
              <p className="text-sm font-semibold mb-2">Margem</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Prevista</p>
                  <p className="font-mono text-lg font-semibold mt-1">{data.margin.plannedPct !== null ? `${data.margin.plannedPct.toFixed(1)}%` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Atual</p>
                  <p className="font-mono text-lg font-semibold mt-1">{data.margin.actualPct !== null ? `${data.margin.actualPct.toFixed(1)}%` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Diferença</p>
                  <p className={`font-mono text-lg font-semibold mt-1 ${data.margin.diffPp !== null && data.margin.diffPp < 0 ? 'text-destructive' : 'text-success'}`}>
                    {data.margin.diffPp !== null ? `${data.margin.diffPp > 0 ? '+' : ''}${data.margin.diffPp.toFixed(1)} p.p.` : '—'}
                  </p>
                </div>
              </div>
              {data.margin.diffPp !== null && data.margin.diffPp < 0 && (
                <p className="text-xs text-warning flex items-center gap-1.5 mt-3">
                  <AlertTriangle size={14} />Margem abaixo do planejado.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
