'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, StockItem, StockItemInput, StockMovementInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StockItemForm } from '@/components/stock-item-form';
import { StockMovementForm } from '@/components/stock-movement-form';
import { Plus, ArrowRightLeft, Trash2 } from 'lucide-react';

export default function EstoquePage() {
  const { token } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moving, setMoving] = useState<StockItem | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listStockItems(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: StockItemInput) {
    if (!token) return;
    await api.createStockItem(token, data);
    setOpen(false);
    load();
  }

  async function handleMovement(data: StockMovementInput) {
    if (!token || !moving) return;
    await api.addStockMovement(token, moving.id, data);
    setMoveOpen(false);
    load();
  }

  async function handleDelete(item: StockItem) {
    if (!token || !confirm(`Remover "${item.material.name}" do controle de estoque?`)) return;
    await api.deleteStockItem(token, item.id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-gray-500">Posição de estoque e movimentações.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Novo Item</Button>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Quantidade</TableHead><TableHead>Mínimo</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Nenhum item no estoque.</TableCell></TableRow>
            ) : items.map((item) => {
              const isLow = item.quantity <= item.minQuantity;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.material.name}</TableCell>
                  <TableCell>{item.material.category}</TableCell>
                  <TableCell>{item.quantity} {item.material.unit}</TableCell>
                  <TableCell>{item.minQuantity} {item.material.unit}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {isLow ? 'Estoque Baixo' : 'OK'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Movimentar" onClick={() => { setMoving(item); setMoveOpen(true); }}>
                        <ArrowRightLeft size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Item de Estoque</DialogTitle></DialogHeader>
          <StockItemForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Movimentar Estoque</DialogTitle></DialogHeader>
          {moving && <StockMovementForm item={moving} onSubmit={handleMovement} onCancel={() => setMoveOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}