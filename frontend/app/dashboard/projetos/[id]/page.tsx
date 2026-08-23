'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, Project, ProjectPhase, ProjectPhaseInput, ProjectStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectPhaseForm } from '@/components/project-phase-form';
import { PrevistoRealizadoCard } from '@/components/previsto-realizado-card';
import { ProjectFinancialAnalysisView } from '@/components/project-financial-analysis-view';
import { ArrowLeft, Plus, Pencil, Trash2, LineChart as LineChartIcon } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine,
} from 'recharts';

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em Andamento',
  ON_HOLD: 'Pausado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

function fmtDate(v: string | number) {
  return new Date(v).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

function buildPlannedCurve(phases: ProjectPhase[]) {
  if (phases.length === 0) return [];
  const dates = new Set<number>();
  phases.forEach((p) => {
    dates.add(new Date(p.plannedStart).getTime());
    dates.add(new Date(p.plannedEnd).getTime());
  });
  const sorted = Array.from(dates).sort((a, b) => a - b);

  return sorted.map((t) => {
    let planned = 0;
    phases.forEach((p) => {
      const start = new Date(p.plannedStart).getTime();
      const end = new Date(p.plannedEnd).getTime();
      const frac = end > start ? Math.min(1, Math.max(0, (t - start) / (end - start))) : (t >= start ? 1 : 0);
      planned += p.weightPct * frac;
    });
    return { timestamp: t, planejado: round1(planned) };
  });
}

function computeTodayStats(phases: ProjectPhase[]) {
  const now = Date.now();
  let planned = 0;
  phases.forEach((p) => {
    const start = new Date(p.plannedStart).getTime();
    const end = new Date(p.plannedEnd).getTime();
    const frac = end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : (now >= start ? 1 : 0);
    planned += p.weightPct * frac;
  });
  const actual = phases.reduce((s, p) => s + p.weightPct * (p.progressPct / 100), 0);
  return {
    now,
    plannedToday: round1(planned),
    actualToday: round1(actual),
    diff: round1(actual - planned),
  };
}

export default function ProjetoDetailPage() {
  const { token } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectPhase | undefined>();
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const [p, ph] = await Promise.all([
        api.getProject(token, id),
        api.listProjectPhases(token, id),
      ]);
      setProject(p);
      setPhases(ph);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: ProjectPhaseInput) {
    if (!token) return;
    await api.createProjectPhase(token, data);
    setOpen(false);
    load();
  }

  async function handleUpdate(data: ProjectPhaseInput) {
    if (!token || !editing) return;
    await api.updateProjectPhase(token, editing.id, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleDelete(phase: ProjectPhase) {
    if (!token || !confirm(`Excluir a etapa "${phase.name}"?`)) return;
    await api.deleteProjectPhase(token, phase.id);
    load();
  }

  if (loading || !project) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  const totalWeight = phases.reduce((s, p) => s + p.weightPct, 0);
  const curve = buildPlannedCurve(phases);
  const { now, plannedToday, actualToday, diff } = computeTodayStats(phases);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/projetos')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.number} — {project.name}</h1>
          <p className="text-muted-foreground">{project.client.name} · {statusLabels[project.status]}</p>
        </div>
        <Button variant="outline" onClick={() => setAnalysisOpen(true)}>
          <LineChartIcon size={16} className="mr-2" />
          Análise Financeira
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Curva S — Avanço Físico</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {phases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre etapas para gerar a curva S.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary rounded-md p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Planejado (hoje)</p>
                  <p className="font-mono text-lg font-semibold text-primary mt-1">{plannedToday}%</p>
                </div>
                <div className="bg-secondary rounded-md p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Real (última medição)</p>
                  <p className="font-mono text-lg font-semibold text-info mt-1">{actualToday}%</p>
                </div>
                <div className="bg-secondary rounded-md p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Diferença</p>
                  <p className={`font-mono text-lg font-semibold mt-1 ${diff >= 0 ? 'text-success' : 'text-destructive'}`}>{diff > 0 ? '+' : ''}{diff} pts</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={curve}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e3138" />
                  <XAxis dataKey="timestamp" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: '#8b929e' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#8b929e' }} domain={[0, 100]} unit="%" />
                  <Tooltip labelFormatter={(v) => fmtDate(v as number)} contentStyle={{ background: '#1e2026', border: '1px solid #2e3138', borderRadius: 8, color: '#d8dce6' }} />
                  <Line type="monotone" dataKey="planejado" name="Planejado" stroke="#c8a96e" strokeWidth={2} dot={{ r: 3 }} />
                  <ReferenceLine x={now} stroke="#8b929e" strokeDasharray="4 4" label={{ value: 'Hoje', fontSize: 10, fill: '#8b929e', position: 'top' }} />
                  <ReferenceDot x={now} y={actualToday} r={5} fill="#4a9ede" stroke="#0e0f11" />
                </LineChart>
              </ResponsiveContainer>

              {Math.abs(totalWeight - 100) > 0.5 && (
                <p className="text-xs text-warning">Atenção: a soma dos pesos das etapas é {totalWeight}%, não 100%. Ajuste os pesos para uma curva S precisa.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Etapas da Obra</CardTitle>
          <Button size="sm" onClick={() => { setEditing(undefined); setOpen(true); }}>
            <Plus size={16} className="mr-2" />Nova Etapa
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Período Planejado</TableHead>
                  <TableHead>Avanço</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phases.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma etapa cadastrada.</TableCell></TableRow>
                ) : (
                  phases.map((phase) => (
                    <TableRow key={phase.id}>
                      <TableCell className="font-medium">{phase.name}</TableCell>
                      <TableCell className="font-mono">{phase.weightPct}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(phase.plannedStart)} — {fmtDate(phase.plannedEnd)}</TableCell>
                      <TableCell className="font-mono">{phase.progressPct}%</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(phase); setOpen(true); }}><Pencil size={16} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(phase)}><Trash2 size={16} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PrevistoRealizadoCard projectId={id} />

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle></DialogHeader>
          <ProjectPhaseForm
            projectId={id}
            initialData={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setOpen(false); setEditing(undefined); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Análise Financeira — {project.number}</DialogTitle></DialogHeader>
          {analysisOpen && <ProjectFinancialAnalysisView projectId={id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
