'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Budget, BudgetStatus, Settings } from '@/lib/api';
import { marginBadgeClass, marginLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Pencil } from 'lucide-react';
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
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  NEGOTIATING: 'bg-yellow-100 text-yellow-700',
};

export default function OrcamentosPage() {
  const { token } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-gray-500">Orçamentos de projetos e serviços.</p>
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

      <div className="border rounded-md bg-white">
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
                <TableCell colSpan={7} className="text-center text-gray-500">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : budgets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  Nenhum orçamento cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              budgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">{budget.number}</TableCell>
                  <TableCell>{budget.client.name}</TableCell>
                  <TableCell>{formatDate(budget.createdAt)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[budget.status]}`}
                    >
                      {statusLabels[budget.status]}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(budget.totals.total)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${marginBadgeClass(
                        budget.totals.estimatedMarginPct,
                        settings?.marginHealthyPct ?? 20,
                        settings?.marginWarningPct ?? 10,
                      )}`}
                    >
                      {budget.totals.estimatedMarginPct.toFixed(1)}% · {marginLabel(
                        budget.totals.estimatedMarginPct,
                        settings?.marginHealthyPct ?? 20,
                        settings?.marginWarningPct ?? 10,
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
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
    </div>
  );
}