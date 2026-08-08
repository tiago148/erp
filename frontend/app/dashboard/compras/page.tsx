'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Supplier, SupplierInput, PurchaseOrder, PurchaseOrderInput, PurchaseOrderStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierForm } from '@/components/supplier-form';
import { PurchaseOrderForm } from '@/components/purchase-order-form';
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
  PENDING: 'bg-yellow-100 text-yellow-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
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
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Documento</TableHead><TableHead>Telefone</TableHead><TableHead className="w-24">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-gray-500">Nenhum fornecedor cadastrado.</TableCell></TableRow>
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
    if (!token || !confirm(`Confirmar recebimento do pedido ${order.number}? Isso vai atualizar o estoque.`)) return;
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
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead><TableHead>Fornecedor</TableHead><TableHead>Status</TableHead>
              <TableHead>Total</TableHead><TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Nenhum pedido de compra.</TableCell></TableRow>
            ) : items.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.number}</TableCell>
                <TableCell>{order.supplier.name}</TableCell>
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

export default function ComprasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compras</h1>
        <p className="text-gray-500">Fornecedores e pedidos de compra.</p>
      </div>
      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>
        <TabsContent value="pedidos"><PurchaseOrdersTab /></TabsContent>
        <TabsContent value="fornecedores"><SuppliersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
