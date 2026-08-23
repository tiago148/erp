'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Material, Project, Supplier, QuotationInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, X, AlertTriangle } from 'lucide-react';

interface ProposalDraft { supplierId: string; unitCost: string; leadTimeDays: string }
interface ItemDraft { materialId: string; quantity: string; proposals: ProposalDraft[] }

interface Props {
  onSubmit: (data: QuotationInput) => Promise<void>;
  onCancel: () => void;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function emptyItem(): ItemDraft {
  return {
    materialId: '',
    quantity: '',
    proposals: [{ supplierId: '', unitCost: '', leadTimeDays: '' }, { supplierId: '', unitCost: '', leadTimeDays: '' }, { supplierId: '', unitCost: '', leadTimeDays: '' }],
  };
}

// Mesma logica de comparacao do protótipo (calcCotacao), aplicada aos
// rascunhos de proposta ainda nao salvos, para mostrar o resultado ao vivo
// enquanto o usuario digita — antes mesmo de clicar em "Criar Cotação".
function compareDrafts(proposals: ProposalDraft[], quantity: number) {
  const q = quantity || 1;
  const valid = proposals
    .map((p, idx) => ({ idx, unitCost: parseFloat(p.unitCost) || 0, leadTimeDays: parseFloat(p.leadTimeDays) || 0 }))
    .filter((p) => p.unitCost > 0);
  if (valid.length === 0) return null;
  const cheapest = valid.reduce((a, b) => (b.unitCost * q < a.unitCost * q ? b : a));
  const priciest = valid.reduce((a, b) => (b.unitCost * q > a.unitCost * q ? b : a));
  const withLeadTime = valid.filter((p) => p.leadTimeDays > 0);
  const fastest = withLeadTime.length ? withLeadTime.reduce((a, b) => (b.leadTimeDays < a.leadTimeDays ? b : a)) : null;
  const savings = priciest.unitCost * q - cheapest.unitCost * q;
  const savingsPct = priciest.unitCost > 0 ? (savings / (priciest.unitCost * q)) * 100 : 0;
  const cheapestIsSlowest = fastest && fastest.idx !== cheapest.idx;
  return { cheapestIdx: cheapest.idx, fastestIdx: fastest?.idx, savings, savingsPct, hasMultiple: valid.length > 1, cheapestIsSlowest };
}

export function QuotationForm({ onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [quotedAt, setQuotedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listMaterials(token).then(setMaterials);
    api.listProjects(token).then(setProjects);
    api.listSuppliers(token).then(setSuppliers);
  }, [token]);

  function addItem() {
    setItems([...items, emptyItem()]);
  }

  function updateItem(idx: number, field: 'materialId' | 'quantity', value: string) {
    const arr = [...items];
    arr[idx] = { ...arr[idx], [field]: value };
    setItems(arr);
  }

  function updateProposal(itemIdx: number, propIdx: number, field: keyof ProposalDraft, value: string) {
    const arr = [...items];
    const proposals = [...arr[itemIdx].proposals];
    proposals[propIdx] = { ...proposals[propIdx], [field]: value };
    arr[itemIdx] = { ...arr[itemIdx], proposals };
    setItems(arr);
  }

  function addProposalSlot(itemIdx: number) {
    const arr = [...items];
    arr[itemIdx] = { ...arr[itemIdx], proposals: [...arr[itemIdx].proposals, { supplierId: '', unitCost: '', leadTimeDays: '' }] };
    setItems(arr);
  }

  function removeProposalSlot(itemIdx: number, propIdx: number) {
    const arr = [...items];
    arr[itemIdx] = { ...arr[itemIdx], proposals: arr[itemIdx].proposals.filter((_, i) => i !== propIdx) };
    setItems(arr);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { setError('Adicione ao menos um item para cotar.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        description: description || undefined,
        projectId: projectId || undefined,
        quotedAt: quotedAt || undefined,
        items: items.map((i) => ({
          materialId: i.materialId,
          quantity: parseFloat(i.quantity) || 0,
          proposals: i.proposals
            .filter((p) => p.supplierId && parseFloat(p.unitCost) > 0)
            .map((p) => ({
              supplierId: p.supplierId,
              unitCost: parseFloat(p.unitCost) || 0,
              leadTimeDays: p.leadTimeDays ? parseInt(p.leadTimeDays, 10) : undefined,
            })),
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cotação');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Materiais para obra X" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Projeto</Label>
          <Select value={projectId} onValueChange={(v) => setProjectId(v ?? '')}>
            <SelectTrigger className="w-full"><SelectValue placeholder="— Geral —">{projects.find((p) => p.id === projectId)?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} — {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data da Cotação</Label>
          <Input type="date" value={quotedAt} onChange={(e) => setQuotedAt(e.target.value)} />
        </div>
      </div>

      {items.length === 0 && (
        <div className="border border-dashed rounded-md p-6 text-center text-sm text-muted-foreground">
          Nenhum item adicionado.
          <div className="pt-2"><Button type="button" size="sm" onClick={addItem}><Plus size={14} className="mr-1" />Adicionar item</Button></div>
        </div>
      )}

      {items.map((item, idx) => {
        const material = materials.find((m) => m.id === item.materialId);
        const qty = parseFloat(item.quantity) || 1;
        const comparison = compareDrafts(item.proposals, qty);
        const n = item.proposals.length;
        return (
          <div key={idx} className="border rounded-md p-3 space-y-3 bg-card">
            <div className="flex gap-2 items-center">
              <Select value={item.materialId} onValueChange={(v) => updateItem(idx, 'materialId', v ?? '')}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione o material">{material ? `${material.name} (${material.unit})` : undefined}</SelectValue></SelectTrigger>
                <SelectContent>
                  {materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" min="0.01" className="w-28" placeholder="Qtd." value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
              <Button type="button" size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Propostas dos Fornecedores</p>
              <div className="overflow-x-auto">
                <div className="grid gap-2 items-center min-w-[480px]" style={{ gridTemplateColumns: `1.1fr repeat(${n}, minmax(120px, 1fr))` }}>
                  <div />
                  {item.proposals.map((_, pi) => (
                    <div key={pi} className="flex justify-between items-center text-[10px] uppercase tracking-wide text-muted-foreground font-semibold pb-1 border-b">
                      <span>Fornecedor {pi + 1}</span>
                      {n > 3 && <button type="button" onClick={() => removeProposalSlot(idx, pi)} className="text-muted-foreground hover:text-destructive"><X size={12} /></button>}
                    </div>
                  ))}

                  <div className="text-xs text-muted-foreground">Fornecedor</div>
                  {item.proposals.map((p, pi) => (
                    <Select key={pi} value={p.supplierId} onValueChange={(v) => updateProposal(idx, pi, 'supplierId', v || '')}>
                      <SelectTrigger className={comparison?.cheapestIdx === pi ? 'border-success/50' : ''}><SelectValue placeholder="—">{suppliers.find((s) => s.id === p.supplierId)?.name}</SelectValue></SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ))}

                  <div className="text-xs text-muted-foreground">Preço unit.</div>
                  {item.proposals.map((p, pi) => (
                    <Input key={pi} type="number" step="0.01" min="0" value={p.unitCost}
                      className={comparison?.cheapestIdx === pi ? 'border-success/50 bg-success/10 font-medium' : ''}
                      onChange={(e) => updateProposal(idx, pi, 'unitCost', e.target.value)} />
                  ))}

                  <div className="text-xs text-muted-foreground">Prazo (dias)</div>
                  {item.proposals.map((p, pi) => (
                    <Input key={pi} type="number" step="1" min="0" value={p.leadTimeDays}
                      className={comparison?.fastestIdx === pi ? 'border-info/50 text-info' : ''}
                      onChange={(e) => updateProposal(idx, pi, 'leadTimeDays', e.target.value)} />
                  ))}

                  <div className="text-xs text-muted-foreground">Total</div>
                  {item.proposals.map((p, pi) => {
                    const cost = parseFloat(p.unitCost) || 0;
                    return (
                      <div key={pi} className={`text-sm text-center py-1.5 rounded font-mono ${comparison?.cheapestIdx === pi ? 'bg-success/10 border border-success/30 text-success font-medium' : 'text-muted-foreground'}`}>
                        {cost > 0 ? fmt(cost * qty) : '—'}
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => addProposalSlot(idx)}><Plus size={12} className="mr-1" />Fornecedor</Button>
            </div>

            {comparison && (
              <div className="text-xs bg-muted rounded-md p-2 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Melhor preço</span><span className="font-medium text-success">Fornecedor {comparison.cheapestIdx + 1}</span></div>
                {comparison.hasMultiple && (
                  <div className="flex justify-between border-t pt-1"><span className="text-muted-foreground">Economia vs. mais caro</span><span className="font-medium text-accent-foreground">{fmt(comparison.savings)} ({comparison.savingsPct.toFixed(1)}%)</span></div>
                )}
                {comparison.cheapestIsSlowest && (
                  <p className="flex items-start gap-1.5 text-warning bg-warning/10 rounded p-2 mt-1">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    O mais barato não é o mais rápido — avalie se o prazo apertado da obra justifica pagar a diferença.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {items.length > 0 && (
        <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus size={14} className="mr-1" />Adicionar outro item</Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Criando...' : 'Criar Cotação'}</Button>
      </div>
    </form>
  );
}
