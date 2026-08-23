'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Quotation, QuotationProposal, Supplier } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Plus, AlertTriangle } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  quotationId: string;
  onChanged: () => void;
}

// Mesma logica de comparacao do protótipo (calcCotacao): melhor preco,
// menor prazo, economia vs. a proposta mais cara, e um aviso quando o mais
// barato nao e o mais rapido.
function compareProposals(proposals: QuotationProposal[], quantity: number) {
  if (proposals.length === 0) return null;
  const withTotal = proposals.map((p) => ({ p, total: p.unitCost * quantity }));
  const cheapest = withTotal.reduce((a, b) => (b.total < a.total ? b : a)).p;
  const priciest = withTotal.reduce((a, b) => (b.total > a.total ? b : a)).p;
  const withLeadTime = proposals.filter((p) => p.leadTimeDays !== undefined && p.leadTimeDays !== null);
  const fastest = withLeadTime.length
    ? withLeadTime.reduce((a, b) => (b.leadTimeDays! < a.leadTimeDays! ? b : a))
    : null;
  const savings = priciest.unitCost * quantity - cheapest.unitCost * quantity;
  const savingsPct = priciest.unitCost > 0 ? (savings / (priciest.unitCost * quantity)) * 100 : 0;
  const cheapestIsSlowest = fastest && fastest.id !== cheapest.id;
  return { cheapest, fastest, savings, savingsPct, hasMultiple: proposals.length > 1, cheapestIsSlowest };
}

export function QuotationDetail({ quotationId, onChanged }: Props) {
  const { token } = useAuth();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [proposalDrafts, setProposalDrafts] = useState<Record<string, { supplierId: string; unitCost: string; leadTimeDays: string }>>({});
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState<{ createdCount: number; skippedItems: string[] } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const q = await api.getQuotation(token, quotationId);
    setQuotation(q);
  }, [token, quotationId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (token) api.listSuppliers(token).then(setSuppliers); }, [token]);

  async function handleAddProposal(itemId: string) {
    if (!token) return;
    const draft = proposalDrafts[itemId];
    if (!draft?.supplierId || !draft?.unitCost) { setError('Selecione o fornecedor e informe o preço.'); return; }
    setError('');
    try {
      await api.addQuotationProposal(token, itemId, {
        supplierId: draft.supplierId,
        unitCost: parseFloat(draft.unitCost) || 0,
        leadTimeDays: draft.leadTimeDays ? parseInt(draft.leadTimeDays, 10) : undefined,
      });
      setProposalDrafts((p) => ({ ...p, [itemId]: { supplierId: '', unitCost: '', leadTimeDays: '' } }));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar proposta');
    }
  }

  async function handleSelectWinner(proposalId: string) {
    if (!token) return;
    await api.selectQuotationWinner(token, proposalId);
    load();
  }

  async function handleGenerateOrders() {
    if (!token || !quotation) return;
    if (!confirm('Gerar pedido(s) de compra a partir dos vencedores selecionados?')) return;
    setError('');
    try {
      const r = await api.generateOrdersFromQuotation(token, quotation.id);
      setOrderResult({ createdCount: r.orders.length, skippedItems: r.skippedItems });
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar pedidos');
    }
  }

  if (!quotation) return <p className="text-muted-foreground text-sm">Carregando...</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Projeto: </span>{quotation.project ? `${quotation.project.number} — ${quotation.project.name}` : '— Geral —'}</div>
        <div><span className="text-muted-foreground">Data da cotação: </span>{new Date(quotation.quotedAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
      </div>

      {quotation.status === 'CLOSED' && (
        <p className="text-xs text-info bg-info/10 border border-info/30 rounded-md p-2">Esta cotação já foi fechada — os pedidos de compra correspondentes já foram gerados.</p>
      )}

      {orderResult && (
        <div className="text-sm bg-success/10 border border-success/30 rounded-md p-3 space-y-1">
          <p className="text-success font-medium">{orderResult.createdCount} pedido(s) de compra gerado(s).</p>
          {orderResult.skippedItems.length > 0 && (
            <p className="text-warning text-xs">Itens sem vencedor selecionado (não incluídos): {orderResult.skippedItems.join(', ')}</p>
          )}
        </div>
      )}

      {quotation.items.map((item) => {
        const draft = proposalDrafts[item.id] || { supplierId: '', unitCost: '', leadTimeDays: '' };
        const comparison = compareProposals(item.proposals, item.quantity);
        const n = item.proposals.length;
        return (
          <div key={item.id} className="border rounded-md p-3 space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-medium text-sm">{item.material.name} <span className="text-muted-foreground">({item.quantity} {item.material.unit})</span></p>
            </div>

            {n > 0 && (
              <div className="overflow-x-auto">
                <div
                  className="grid gap-2 items-center min-w-[420px]"
                  style={{ gridTemplateColumns: `1.3fr repeat(${n}, minmax(110px, 1fr))` }}
                >
                  <div />
                  {item.proposals.map((p) => {
                    const isWinner = p.isWinner;
                    const isCheapest = comparison?.cheapest.id === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`text-[10px] uppercase tracking-wide font-semibold text-center pb-1.5 border-b truncate px-1 ${
                          isWinner ? 'text-success' : isCheapest ? 'text-success/80' : 'text-muted-foreground'
                        }`}
                        title={p.supplier.name}
                      >
                        {p.supplier.name}
                      </div>
                    );
                  })}

                  <div className="text-xs text-muted-foreground">Preço unit.</div>
                  {item.proposals.map((p) => {
                    const isWinner = p.isWinner;
                    const isCheapest = comparison?.cheapest.id === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`text-sm text-center py-1 rounded ${
                          isWinner ? 'bg-success/15 border border-success/40 font-semibold text-success' : isCheapest ? 'bg-success/10 border border-success/30 font-medium' : ''
                        }`}
                      >
                        {fmt(p.unitCost)}
                      </div>
                    );
                  })}

                  <div className="text-xs text-muted-foreground">Prazo (dias)</div>
                  {item.proposals.map((p) => {
                    const isWinner = p.isWinner;
                    const isCheapest = comparison?.cheapest.id === p.id;
                    const isFastest = comparison?.fastest?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`text-sm text-center py-1 rounded ${
                          isWinner ? 'bg-success/15 border border-success/40' : isCheapest ? 'bg-success/10 border border-success/30' : ''
                        } ${isFastest ? 'text-info font-medium' : 'text-muted-foreground'}`}
                      >
                        {p.leadTimeDays ? `${p.leadTimeDays}d` : '—'}
                      </div>
                    );
                  })}

                  <div className="text-xs text-muted-foreground">Total</div>
                  {item.proposals.map((p) => {
                    const isWinner = p.isWinner;
                    const isCheapest = comparison?.cheapest.id === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`text-sm text-center py-1 rounded font-mono ${
                          isWinner ? 'bg-success/15 border border-success/40 text-success' : isCheapest ? 'bg-success/10 border border-success/30' : ''
                        }`}
                      >
                        {fmt(p.unitCost * item.quantity)}
                      </div>
                    );
                  })}

                  <div />
                  {item.proposals.map((p) => (
                    <div key={p.id} className="flex justify-center py-1">
                      {p.isWinner ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success flex items-center gap-1"><Check size={12} />Vencedor</span>
                      ) : quotation.status === 'OPEN' ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => handleSelectWinner(p.id)}>Marcar</Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comparison?.hasMultiple && (
              <div className="text-xs bg-muted rounded-md p-2 space-y-1">
                <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Melhor preço</span><span className="font-medium text-success">{comparison.cheapest.supplier.name} — {fmt(comparison.cheapest.unitCost * item.quantity)}</span></div>
                {comparison.fastest && (
                  <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Menor prazo</span><span className="font-medium text-info">{comparison.fastest.supplier.name} — {comparison.fastest.leadTimeDays} dias</span></div>
                )}
                <div className="flex justify-between pt-1"><span className="text-muted-foreground">Economia vs. mais caro</span><span className="font-medium text-accent-foreground">{fmt(comparison.savings)} ({comparison.savingsPct.toFixed(1)}%)</span></div>
                {comparison.cheapestIsSlowest && (
                  <p className="flex items-start gap-1.5 text-warning bg-warning/10 rounded p-2 mt-1">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    O mais barato não é o mais rápido — avalie se o prazo apertado da obra justifica pagar a diferença.
                  </p>
                )}
              </div>
            )}

            {quotation.status === 'OPEN' && (
              <div className="flex gap-2 items-center pt-1">
                <Select value={draft.supplierId} onValueChange={(v) => setProposalDrafts((p) => ({ ...p, [item.id]: { ...draft, supplierId: v || '' } }))}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Fornecedor">{suppliers.find((s) => s.id === draft.supplierId)?.name}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" step="0.01" min="0" placeholder="Preço unit." className="w-28" value={draft.unitCost}
                  onChange={(e) => setProposalDrafts((p) => ({ ...p, [item.id]: { ...draft, unitCost: e.target.value } }))} />
                <Input type="number" step="1" min="0" placeholder="Prazo (dias)" className="w-28" value={draft.leadTimeDays}
                  onChange={(e) => setProposalDrafts((p) => ({ ...p, [item.id]: { ...draft, leadTimeDays: e.target.value } }))} />
                <Button type="button" size="icon" variant="ghost" onClick={() => handleAddProposal(item.id)}><Plus size={16} /></Button>
              </div>
            )}
          </div>
        );
      })}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {quotation.status === 'OPEN' && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleGenerateOrders}>Gerar Pedido(s) de Compra</Button>
        </div>
      )}
    </div>
  );
}
