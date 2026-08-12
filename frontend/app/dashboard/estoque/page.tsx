'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, StockItem, StockItemInput, StockMovementInput, MaterialSurplus, MaterialSurplusInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockItemForm } from '@/components/stock-item-form';
import { StockMovementForm } from '@/components/stock-movement-form';
import { MaterialSurplusForm } from '@/components/material-surplus-form';
import { Plus, ArrowRightLeft, Trash2, Download, Undo2, PackageCheck } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function StockPositionTab() {
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
    <div className="space-y-4">
      <div className="flex justify-end">
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

const surplusStatusLabels: Record<string, string> = {
  PENDING: 'Pendente', RETURNED_TO_STOCK: 'Devolvida ao Estoque', KEPT_AT_PROJECT: 'Mantida no Projeto',
};
const surplusStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  RETURNED_TO_STOCK: 'bg-green-100 text-green-700',
  KEPT_AT_PROJECT: 'bg-blue-100 text-blue-700',
};

function SurplusTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<MaterialSurplus[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listMaterialSurpluses(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: MaterialSurplusInput) {
    if (!token) return;
    await api.createMaterialSurplus(token, data);
    setOpen(false);
    load();
  }

  async function handleReturn(s: MaterialSurplus) {
    if (!token || !confirm(`Devolver ${s.quantity} ${s.material.unit} de "${s.material.name}" ao estoque geral?`)) return;
    await api.returnMaterialSurplusToStock(token, s.id);
    load();
  }

  async function handleKeep(s: MaterialSurplus) {
    if (!token || !confirm(`Marcar como sobra mantida no projeto "${s.project.name}"?`)) return;
    await api.keepMaterialSurplusAtProject(token, s.id);
    load();
  }

  async function handleDelete(s: MaterialSurplus) {
    if (!token || !confirm('Excluir este registro de sobra?')) return;
    await api.deleteMaterialSurplus(token, s.id);
    load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Material comprado a mais do que foi usado em um projeto — devolva ao estoque geral ou mantenha registrado como sobra no local.</p>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Registrar Sobra</Button>
      </div>
      <div className="border rounded-md bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead><TableHead>Material</TableHead><TableHead>Quantidade</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Nenhuma sobra registrada.</TableCell></TableRow>
            ) : items.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.project.name}</TableCell>
                <TableCell className="font-medium">{s.material.name}</TableCell>
                <TableCell>{s.quantity} {s.material.unit}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${surplusStatusColors[s.status]}`}>{surplusStatusLabels[s.status]}</span></TableCell>
                <TableCell>
                  {s.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Devolver ao estoque" onClick={() => handleReturn(s)}><Undo2 size={16} /></Button>
                      <Button variant="ghost" size="icon" title="Manter no projeto" onClick={() => handleKeep(s)}><PackageCheck size={16} /></Button>
                      <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDelete(s)}><Trash2 size={16} /></Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Sobra de Material</DialogTitle></DialogHeader>
          <MaterialSurplusForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([String.fromCharCode(0xfeff) + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ReplenishmentTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.listStockItems(token).then((data) => { setItems(data); setLoading(false); });
  }, [token]);

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  const belowMinimum = items
    .filter((i) => i.quantity <= i.minQuantity)
    .map((i) => {
      const suggestedQty = Math.max(0, i.minQuantity - i.quantity);
      return { item: i, suggestedQty, totalCost: suggestedQty * i.material.unitCost };
    });

  const totalCost = belowMinimum.reduce((s, r) => s + r.totalCost, 0);

  function handleExport() {
    downloadCsv('lista-de-reposicao.csv', [
      ['Material', 'Categoria', 'Estoque Atual', 'Mínimo', 'Quantidade Sugerida', 'Custo Unitário', 'Custo Total'],
      ...belowMinimum.map((r) => [
        r.item.material.name, r.item.material.category, r.item.quantity, r.item.minQuantity,
        r.suggestedQty, r.item.material.unitCost, r.totalCost,
      ]),
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Materiais abaixo do mínimo, com quantidade sugerida para repor até o nível mínimo.</p>
        <Button variant="outline" disabled={belowMinimum.length === 0} onClick={handleExport}>
          <Download size={16} className="mr-2" />Exportar CSV
        </Button>
      </div>
      <div className="border rounded-md bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead><TableHead>Estoque Atual</TableHead><TableHead>Mínimo</TableHead>
              <TableHead>Qtd. Sugerida</TableHead><TableHead>Custo Estimado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {belowMinimum.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Nenhum item abaixo do mínimo no momento.</TableCell></TableRow>
            ) : belowMinimum.map(({ item, suggestedQty, totalCost }) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.material.name}</TableCell>
                <TableCell>{item.quantity} {item.material.unit}</TableCell>
                <TableCell>{item.minQuantity} {item.material.unit}</TableCell>
                <TableCell className="font-medium">{suggestedQty} {item.material.unit}</TableCell>
                <TableCell>{fmt(totalCost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {belowMinimum.length > 0 && (
          <div className="flex justify-end px-4 py-3 border-t font-semibold text-sm">Custo total estimado: {fmt(totalCost)}</div>
        )}
      </div>
    </div>
  );
}

export default function EstoquePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estoque</h1>
        <p className="text-gray-500">Posição de estoque, sobras de projeto e lista de reposição.</p>
      </div>

      <Tabs defaultValue="posicao">
        <TabsList>
          <TabsTrigger value="posicao">Posição</TabsTrigger>
          <TabsTrigger value="sobras">Sobras</TabsTrigger>
          <TabsTrigger value="reposicao">Lista de Reposição</TabsTrigger>
        </TabsList>
        <TabsContent value="posicao"><StockPositionTab /></TabsContent>
        <TabsContent value="sobras"><SurplusTab /></TabsContent>
        <TabsContent value="reposicao"><ReplenishmentTab /></TabsContent>
      </Tabs>
    </div>
  );
}
