'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Supplier, SupplierInput, PurchaseOrder, PurchaseOrderInput, PurchaseOrderStatus, Quotation, QuotationInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierForm } from '@/components/supplier-form';
import { PurchaseOrderForm } from '@/components/purchase-order-form';
import { QuotationForm } from '@/components/quotation-form';
import { QuotationDetail } from '@/components/quotation-detail';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const statusLabels: Record<PurchaseOrderStatus, string> = {
  PENDING: 'Pendente',
  RECEIVED: 'Recebido',
  CANCELLED: 'Cancelado',
};
const statusColors: Record<PurchaseOrderStatus, string> = {
  PENDING: 'bg-warning/15 text-warning',
  RECEIVED: 'bg-success/15 text-success',
  CANCELLED: 'bg-destructive/15 text-destructive',
};

function SuppliersTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listSuppliers(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: SupplierInput) {
    if (!token) return;
    if (editing) await api.updateSupplier(token, editing.id, data);
    else await api.createSupplier(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(s: Supplier) {
    if (!token || !confirm(`Excluir "${s.name}"?`)) return;
    await api.deleteSupplier(token, s.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Novo Fornecedor</Button>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Documento</TableHead><TableHead>Telefone</TableHead><TableHead className="w-24">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum fornecedor cadastrado.</TableCell></TableRow>
            ) : items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.document || '-'}</TableCell>
                <TableCell>{s.phone || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle></DialogHeader>
          <SupplierForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PurchaseOrdersTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listPurchaseOrders(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: PurchaseOrderInput) {
    if (!token) return;
    await api.createPurchaseOrder(token, data);
    setOpen(false);
    load();
  }

  async function handleReceive(order: PurchaseOrder) {
    if (!token || !confirm(`Confirmar recebimento do pedido ${order.number}? Isso vai atualizar o estoque e gerar uma conta a pagar no Financeiro.`)) return;
    await api.receivePurchaseOrder(token, order.id);
    load();
  }

  async function handleCancel(order: PurchaseOrder) {
    if (!token || !confirm(`Cancelar o pedido ${order.number}?`)) return;
    await api.cancelPurchaseOrder(token, order.id);
    load();
  }

  async function handleDelete(order: PurchaseOrder) {
    if (!token || !confirm(`Excluir o pedido ${order.number}?`)) return;
    await api.deletePurchaseOrder(token, order.id);
    load();
  }

  function orderTotal(order: PurchaseOrder) {
    return order.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Novo Pedido</Button>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead><TableHead>Fornecedor</TableHead><TableHead>Destino</TableHead><TableHead>Status</TableHead>
              <TableHead>Total</TableHead><TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum pedido de compra.</TableCell></TableRow>
            ) : items.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.number}</TableCell>
                <TableCell>{order.supplier.name}</TableCell>
                <TableCell>{order.destinationProject ? order.destinationProject.name : 'Estoque Geral'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                </TableCell>
                <TableCell className="font-semibold">{fmt(orderTotal(order))}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {order.status === 'PENDING' && (
                      <>
                        <Button variant="ghost" size="icon" title="Receber" onClick={() => handleReceive(order)}><Check size={16} /></Button>
                        <Button variant="ghost" size="icon" title="Cancelar" onClick={() => handleCancel(order)}><X size={16} /></Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(order)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo Pedido de Compra</DialogTitle></DialogHeader>
          <PurchaseOrderForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Uma linha por item cotado (nao por cotação) — igual ao protótipo, onde
// cada cotação e um item só. Aqui uma cotação pode ter vários itens, entao
// achatamos para a tabela ficar com a mesma leitura: Data / Item / Qtd /
// Propostas / Vencedor / Valor / Economia / Ações.
function QuotationsTab() {
  const { token } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setQuotations(await api.listQuotations(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: QuotationInput) {
    if (!token) return;
    await api.createQuotation(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(q: Quotation) {
    if (!token || !confirm(`Excluir a cotação ${q.number}?`)) return;
    await api.deleteQuotation(token, q.id);
    load();
  }

  const detailQuotation = quotations.find((q) => q.id === detailId);
  const rows = quotations.flatMap((q) => q.items.map((item) => ({ quotation: q, item })));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end gap-4">
        <p className="text-xs text-muted-foreground max-w-xl">Compare os fornecedores antes de comprar. O sistema aponta o melhor preço e o menor prazo — marque o vencedor e gere o pedido de compra em poucos cliques.</p>
        <Button onClick={() => setOpen(true)} className="shrink-0"><Plus size={16} className="mr-2" />Nova Cotação</Button>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead><TableHead>Item</TableHead><TableHead>Qtd</TableHead><TableHead>Propostas</TableHead>
              <TableHead>Vencedor</TableHead><TableHead>Valor</TableHead><TableHead>Economia</TableHead><TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhuma cotação — compare fornecedores antes de comprar.</TableCell></TableRow>
            ) : rows.map(({ quotation: q, item }) => {
              const winner = item.proposals.find((p) => p.isWinner) ?? (item.proposals.length ? item.proposals.reduce((a, b) => (b.unitCost < a.unitCost ? b : a)) : undefined);
              const totals = item.proposals.map((p) => p.unitCost * item.quantity);
              const economia = totals.length > 1 ? Math.max(...totals) - Math.min(...totals) : 0;
              return (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{fmtDate(q.quotedAt)}</TableCell>
                  <TableCell className="font-medium">{item.material.name}</TableCell>
                  <TableCell className="font-mono">{item.quantity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.proposals.length} proposta(s)</TableCell>
                  <TableCell className="font-medium text-success">{winner ? winner.supplier.name : '—'}</TableCell>
                  <TableCell className="font-mono text-accent-foreground">{winner ? fmt(winner.unitCost * item.quantity) : '—'}</TableCell>
                  <TableCell className="font-mono text-info">{economia > 0 ? fmt(economia) : '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {q.status === 'CLOSED' ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/15 text-success">Convertida</span>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setDetailId(q.id)}>Gerenciar</Button>
                      )}
                      {q.status === 'OPEN' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(q)}><Trash2 size={16} /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Cotação de Compra</DialogTitle></DialogHeader>
          <QuotationForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Cotação {detailQuotation?.number}</DialogTitle></DialogHeader>
          {detailId && <QuotationDetail quotationId={detailId} onChanged={load} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ComprasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compras</h1>
        <p className="text-muted-foreground">Fornecedores e pedidos de compra.</p>
      </div>
      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="cotacoes">Cotações</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>
        <TabsContent value="pedidos"><PurchaseOrdersTab /></TabsContent>
        <TabsContent value="cotacoes"><QuotationsTab /></TabsContent>
        <TabsContent value="fornecedores"><SuppliersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
