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
import { PrintDocument, PrintHeader, PrintSectionTitle, PrintFooter, PrintSignatures } from '@/components/print-document';
import { usePrint } from '@/lib/use-print';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Pencil, Percent, Copy, GitBranch, History, Printer } from 'lucide-react';
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

const regimeLabels: Record<string, string> = {
  SIMPLES: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
  MEI: 'MEI',
};

function BudgetProposalPrint({ budget, settings }: { budget: Budget; settings: Settings | null }) {
  const t = budget.totals;
  const row = (label: string, value: number) => value !== 0 ? (
    <div className="flex justify-between text-sm py-0.5"><span>{label}</span><span>{formatCurrency(value)}</span></div>
  ) : null;

  return (
    <PrintDocument>
      <PrintHeader
        settings={settings}
        docTitle="PROPOSTA COMERCIAL"
        docSubtitle={<>Nº {settings?.budgetPrefix || 'ORC'}-{budget.number}{budget.version > 1 ? ` v${budget.version}` : ''}<br />Data: {formatDate(budget.createdAt)}</>}
      />

      <PrintSectionTitle>Cliente</PrintSectionTitle>
      <p className="text-sm leading-relaxed">
        <strong>{budget.client.name}</strong><br />
        {budget.client.document && <>CNPJ/CPF: {budget.client.document}<br /></>}
        {[budget.client.address, budget.client.city, budget.client.state].filter(Boolean).join(', ')}
      </p>

      {budget.description && (
        <>
          <PrintSectionTitle>Objeto</PrintSectionTitle>
          <p className="text-sm">{budget.description}</p>
        </>
      )}

      {budget.materialItems.length > 0 && (
        <>
          <PrintSectionTitle>Materiais</PrintSectionTitle>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b font-semibold text-left"><th className="py-1">Item</th><th>Un</th><th className="text-right">Qtd</th><th className="text-right">Unit.</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {budget.materialItems.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="py-1">{m.material.name}</td><td>{m.material.unit}</td>
                  <td className="text-right">{m.quantity}</td><td className="text-right">{formatCurrency(m.unitCost)}</td>
                  <td className="text-right">{formatCurrency(m.quantity * m.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {budget.laborItems.length > 0 && (
        <>
          <PrintSectionTitle>Mão de Obra</PrintSectionTitle>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b font-semibold text-left"><th className="py-1">Função</th><th className="text-right">Taxa/h</th><th className="text-right">Horas</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {budget.laborItems.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="py-1">{l.laborRole.name}</td><td className="text-right">{formatCurrency(l.hourlyRate)}</td>
                  <td className="text-right">{l.hours}h</td><td className="text-right">{formatCurrency(l.hours * l.hourlyRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {budget.compositionItems.length > 0 && (
        <>
          <PrintSectionTitle>Serviços Compostos</PrintSectionTitle>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b font-semibold text-left"><th className="py-1">Serviço</th><th className="text-right">Qtd</th><th className="text-right">Unit.</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {budget.compositionItems.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-1">{c.composition.name}</td><td className="text-right">{c.quantity}</td>
                  <td className="text-right">{formatCurrency(c.unitCost)}</td><td className="text-right">{formatCurrency(c.quantity * c.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {budget.otherItems.length > 0 && (
        <>
          <PrintSectionTitle>Outros Custos</PrintSectionTitle>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b font-semibold text-left"><th className="py-1">Descrição</th><th className="text-right">Valor</th></tr></thead>
            <tbody>
              {budget.otherItems.map((o) => (
                <tr key={o.id} className="border-b"><td className="py-1">{o.description}</td><td className="text-right">{formatCurrency(o.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {budget.travelItems.length > 0 && (
        <>
          <PrintSectionTitle>Deslocamento</PrintSectionTitle>
          <p className="text-xs text-gray-600">
            {budget.travelItems.map((tr) => `${tr.vehicle.name} · ${tr.distanceKm}km · ${tr.trips} viagem(ns)`).join(' — ')}
            {' — '}<strong>{formatCurrency(t.travelTotal)}</strong>
          </p>
        </>
      )}

      <PrintSectionTitle>Resumo Financeiro</PrintSectionTitle>
      {row('Materiais', t.materialsTotal)}
      {row('Mão de Obra', t.laborTotal)}
      {row('Serviços Compostos', t.compositionsTotal)}
      {row('Deslocamento', t.travelTotal)}
      {row('Outros Custos', t.otherTotal)}
      <div className="flex justify-between text-sm py-0.5 font-semibold border-t mt-1 pt-1"><span>Subtotal</span><span>{formatCurrency(t.subtotal)}</span></div>
      {row('Custos Indiretos', t.indirectCostValue)}
      {row('Contingência', t.contingenciaValue)}
      {row('Custo Financeiro', t.custoFinanceiroValue)}
      {t.taxes.map((tax) => (
        <div key={tax.name} className="flex justify-between text-xs py-0.5 text-gray-600"><span>{tax.name} ({tax.rate}%)</span><span>{formatCurrency(tax.value)}</span></div>
      ))}
      {t.discountValue > 0 && (
        <div className="flex justify-between text-sm py-0.5"><span>Desconto ({budget.discountPct}%)</span><span>- {formatCurrency(t.discountValue)}</span></div>
      )}
      <div className="flex justify-between text-base py-2 mt-1 font-bold border-t-2 border-black"><span>VALOR TOTAL</span><span>{formatCurrency(t.total)}</span></div>

      <PrintSectionTitle>Condições Comerciais</PrintSectionTitle>
      <p className="text-xs leading-loose">
        <strong>Regime tributário:</strong> {regimeLabels[budget.regime] || budget.regime}<br />
        {budget.prazoRecebimentoDias > 0 && <><strong>Prazo médio de recebimento:</strong> {budget.prazoRecebimentoDias} dias<br /></>}
      </p>

      {budget.notes && (
        <>
          <PrintSectionTitle>Observações</PrintSectionTitle>
          <p className="text-xs">{budget.notes}</p>
        </>
      )}

      <PrintSignatures left={settings?.companyName || 'OPRENDIN'} right={budget.client.name} />
      <PrintFooter settings={settings} />
    </PrintDocument>
  );
}

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
  const [printing, setPrinting] = usePrint<Budget>();

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
                      <Button variant="ghost" size="icon" title="Gerar PDF" onClick={() => setPrinting(budget)}>
                        <Printer size={16} />
                      </Button>
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

      {printing && <BudgetProposalPrint budget={printing} settings={settings} />}
    </div>
  );
}