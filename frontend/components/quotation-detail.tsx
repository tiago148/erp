'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Quotation, Supplier } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Plus } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  quotationId: string;
  onChanged: () => void;
}

export function QuotationDetail({ quotationId, onChanged }: Props) {
  const { token } = useAuth();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [proposalDrafts, setProposalDrafts] = useState<Record<string, { supplierId: string; unitCost: string }>>({});
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
      await api.addQuotationProposal(token, itemId, { supplierId: draft.supplierId, unitCost: parseFloat(draft.unitCost) || 0 });
      setProposalDrafts((p) => ({ ...p, [itemId]: { supplierId: '', unitCost: '' } }));
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
        const draft = proposalDrafts[item.id] || { supplierId: '', unitCost: '' };
        return (
          <div key={item.id} className="border rounded-md p-3 space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-medium text-sm">{item.material.name} <span className="text-muted-foreground">({item.quantity} {item.material.unit})</span></p>
            </div>

            {item.proposals.length > 0 && (
              <div className="space-y-1">
                {item.proposals.map((p) => (
                  <div key={p.id} className={`flex justify-between items-center text-sm py-1 px-2 rounded ${p.isWinner ? 'bg-success/10' : ''}`}>
                    <span>{p.supplier.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{fmt(p.unitCost)}</span>
                      {p.isWinner ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success flex items-center gap-1"><Check size={12} />Vencedor</span>
                      ) : quotation.status === 'OPEN' ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => handleSelectWinner(p.id)}>Marcar vencedor</Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {quotation.status === 'OPEN' && (
              <div className="flex gap-2 items-center pt-1">
                <Select value={draft.supplierId} onValueChange={(v) => setProposalDrafts((p) => ({ ...p, [item.id]: { ...draft, supplierId: v } }))}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Fornecedor">{suppliers.find((s) => s.id === draft.supplierId)?.name}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" step="0.01" min="0" placeholder="Preço unit." className="w-32" value={draft.unitCost}
                  onChange={(e) => setProposalDrafts((p) => ({ ...p, [item.id]: { ...draft, unitCost: e.target.value } }))} />
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
