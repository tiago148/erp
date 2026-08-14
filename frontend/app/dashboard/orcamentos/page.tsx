'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, Budget, BudgetStatus, BudgetVersionSummary, Settings } from '@/lib/api';
import { marginBadgeVariant, marginLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MarginSimulator } from '@/components/margin-simulator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Pencil, Percent, Copy, GitBranch, History } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

const statusLabels: Record<BudgetStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  NEGOTIATING: 'Em Negociação',
};

const statusColors: Record<BudgetStatus, string> = {
  DRAFT: 'bg-secondary text-secondary-foreground',
  SENT: 'bg-info/15 text-info',
  APPROVED: 'bg-success/15 text-success',
  REJECTED: 'bg-destructive/15 text-destructive',
  NEGOTIATING: 'bg-warning/15 text-warning',
};

export default function OrcamentosPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [simulating, setSimulating] = useState<Budget | undefined>();
  const [viewingVersionsOf, setViewingVersionsOf] = useState<Budget | undefined>();
  const [versions, setVersions] = useState<BudgetVersionSummary[]>([]);

  const loadBudgets = useCallback(
    async (searchTerm?: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await api.listBudgets(token, searchTerm);
        setBudgets(data);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  useEffect(() => {
    if (token) api.getSettings(token).then(setSettings);
  }, [token]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadBudgets(search);
  }

  async function handleDelete(budget: Budget) {
    if (!token) return;
    if (!confirm(`Excluir o orçamento nº ${budget.number}?`)) return;

    await api.deleteBudget(token, budget.id);
    loadBudgets(search);
  }

  async function handleDuplicate(budget: Budget) {
    if (!token) return;
    const copy = await api.duplicateBudget(token, budget.id);
    loadBudgets(search);
    router.push(`/dashboard/orcamentos/${copy.id}`);
  }

  async function handleNewVersion(budget: Budget) {
    if (!token) return;
    if (!confirm(`Criar uma nova versão (rascunho) do orçamento nº ${budget.number}?`)) return;
    const newVersion = await api.createBudgetVersion(token, budget.id);
    loadBudgets(search);
    router.push(`/dashboard/orcamentos/${newVersion.id}`);
  }

  async function handleViewVersions(budget: Budget) {
    if (!token) return;
    setViewingVersionsOf(budget);
    setVersions(await api.listBudgetVersions(token, budget.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">Orçamentos de projetos e serviços.</p>
        </div>
        <Link href="/dashboard/orcamentos/novo">
          <Button>
            <Plus size={16} className="mr-2" />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm">
        <Input
          placeholder="Buscar por número ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Margem</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : budgets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum orçamento cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              budgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">
                    {budget.number}
                    {budget.version > 1 && (
                      <button
                        type="button"
                        onClick={() => handleViewVersions(budget)}
                        className="ml-1.5 text-xs text-info hover:underline"
                        title="Ver histórico de versões"
                      >
                        v{budget.version}
                      </button>
                    )}
                  </TableCell>
                  <TableCell>{budget.client.name}</TableCell>
                  <TableCell>{formatDate(budget.createdAt)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[budget.status]}`}
                    >
                      {statusLabels[budget.status]}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold font-mono">
                    {formatCurrency(budget.totals.total)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={marginBadgeVariant(
                        budget.totals.estimatedMarginPct,
                        settings?.marginHealthyPct ?? 20,
                        settings?.marginWarningPct ?? 10,
                      )}
                    >
                      {budget.totals.estimatedMarginPct.toFixed(1)}% · {marginLabel(
                        budget.totals.estimatedMarginPct,
                        settings?.marginHealthyPct ?? 20,
                        settings?.marginWarningPct ?? 10,
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Simular desconto" onClick={() => setSimulating(budget)}>
                        <Percent size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" title="Duplicar" onClick={() => handleDuplicate(budget)}>
                        <Copy size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" title="Nova versão" onClick={() => handleNewVersion(budget)}>
                        <GitBranch size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" title="Ver versões" onClick={() => handleViewVersions(budget)}>
                        <History size={16} />
                      </Button>
                      <Link href={`/dashboard/orcamentos/${budget.id}`}>
                        <Button variant="ghost" size="icon">
                          <Pencil size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(budget)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!simulating} onOpenChange={(v) => { if (!v) setSimulating(undefined); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Simulador de Margem e Desconto</DialogTitle></DialogHeader>
          {simulating && <MarginSimulator budget={simulating} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingVersionsOf} onOpenChange={(v) => { if (!v) setViewingVersionsOf(undefined); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Histórico de Versões — nº {viewingVersionsOf?.number}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma versão encontrada.</p>
            ) : (
              versions.map((v) => (
                <Link
                  key={v.id}
                  href={`/dashboard/orcamentos/${v.id}`}
                  className="flex items-center justify-between text-sm py-2 px-3 rounded-md border border-border hover:bg-muted/40 transition-colors"
                >
                  <span>v{v.version} {v.id === viewingVersionsOf?.id && <span className="text-xs text-muted-foreground">(atual)</span>}</span>
                  <span className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status]}`}>{statusLabels[v.status]}</span>
                    <span className="text-xs text-muted-foreground font-mono">{formatDate(v.createdAt)}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}