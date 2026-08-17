'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Material, MaterialQuote, Supplier, FreightModality, QuoteConfidence } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Pin } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const confidenceVariant: Record<QuoteConfidence, 'success' | 'warning' | 'danger'> = {
  ALTA: 'success',
  MEDIA: 'warning',
  BAIXA: 'danger',
};

const confidenceLabel: Record<QuoteConfidence, string> = {
  ALTA: 'Confiança Alta',
  MEDIA: 'Confiança Média',
  BAIXA: 'Confiança Baixa',
};

interface Props {
  material: Material;
  onMaterialUpdated: (material: Material) => void;
}

const emptyForm = {
  supplierId: '',
  price: 0,
  quantity: 1,
  freight: 0,
  freightModality: 'FOB' as FreightModality,
  validUntil: '',
  notes: '',
};

export function MaterialQuotesDialog({ material, onMaterialUpdated }: Props) {
  const { token } = useAuth();
  const [quotes, setQuotes] = useState<MaterialQuote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [quotesData, suppliersData] = await Promise.all([
        api.listMaterialQuotes(token, material.id),
        api.listSuppliers(token),
      ]);
      setQuotes(quotesData);
      setSuppliers(suppliersData);
    } finally {
      setLoading(false);
    }
  }, [token, material.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!form.supplierId) { setError('Selecione um fornecedor.'); return; }
    if (!form.validUntil) { setError('Informe a validade da cotação.'); return; }
    setError('');
    setSaving(true);
    try {
      await api.createMaterialQuote(token, { materialId: material.id, ...form });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cotação');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(quote: MaterialQuote) {
    if (!token) return;
    if (!confirm('Excluir esta cotação?')) return;
    await api.deleteMaterialQuote(token, quote.id);
    if (material.manualQuoteId === quote.id) {
      const updated = await api.getMaterial(token, material.id);
      onMaterialUpdated(updated);
    }
    load();
  }

  async function handlePin(quote: MaterialQuote) {
    if (!token) return;
    const updated = await api.updateMaterial(token, material.id, {
      referenceMode: 'MANUAL',
      manualQuoteId: quote.id,
    });
    onMaterialUpdated(updated);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md bg-muted p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Preço de referência atual</span>
          <span className="font-semibold">{fmt(material.reference?.referencePrice ?? material.unitCost)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Origem</span>
          <span className="flex items-center gap-2">
            {material.reference?.source === 'QUOTE' ? 'Cotação' : 'Manual (custo unitário)'}
            {material.reference?.confidence && (
              <Badge variant={confidenceVariant[material.reference.confidence]}>
                {confidenceLabel[material.reference.confidence]}
              </Badge>
            )}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border rounded-md p-4 space-y-3">
        <Label className="font-semibold">Nova Cotação</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Fornecedor</Label>
            <Select value={form.supplierId} onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v || '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione...">
                  {suppliers.find((s) => s.id === form.supplierId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Validade da Cotação</Label>
            <Input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>Preço (R$)</Label>
            <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Qtd. Cotada</Label>
            <Input type="number" step="0.001" min="0.001" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 1 }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Frete (R$ total)</Label>
            <Input type="number" step="0.01" min="0" value={form.freight} onChange={(e) => setForm((f) => ({ ...f, freight: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Modalidade</Label>
            <Select value={form.freightModality} onValueChange={(v) => setForm((f) => ({ ...f, freightModality: (v || 'FOB') as FreightModality }))}>
              <SelectTrigger><SelectValue>{form.freightModality}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="FOB">FOB (frete por conta do comprador)</SelectItem>
                <SelectItem value="CIF">CIF (frete incluso no preço)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Input placeholder="Observações (opcional)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={saving} size="sm">
          <Plus size={14} className="mr-1" />{saving ? 'Salvando...' : 'Adicionar Cotação'}
        </Button>
      </form>

      <div className="space-y-2">
        <Label className="font-semibold">Cotações Registradas</Label>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma cotação registrada ainda.</p>
        ) : (
          quotes.map((q) => (
            <div key={q.id} className="border rounded-md p-3 flex items-center justify-between gap-3">
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{q.supplier.name}</span>
                  <Badge variant={confidenceVariant[q.confidence]}>{confidenceLabel[q.confidence]}</Badge>
                  {material.manualQuoteId === q.id && <Badge variant="accent">Fixada como referência</Badge>}
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {fmt(q.price)} + frete {fmt(q.freight)} ({q.freightModality}, qtd. {q.quantity}) — custo posto: <span className="font-semibold text-foreground">{fmt(q.landedCost)}</span>
                </p>
                <p className="text-muted-foreground text-xs">Válida até {new Date(q.validUntil).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button type="button" size="icon" variant="ghost" title="Usar como referência" onClick={() => handlePin(q)}>
                  <Pin size={16} />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => handleDelete(q)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
