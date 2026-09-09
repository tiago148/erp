'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  api, StockItem, StockItemInput, StockMovementInput, MaterialSurplus, MaterialSurplusInput,
  ScrapSale, ScrapSaleInput, Tool, Project, CyclicCount, CyclicCountPlan, CyclicCountInput, Employee,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StockItemForm } from '@/components/stock-item-form';
import { StockMovementForm } from '@/components/stock-movement-form';
import { MaterialSurplusForm } from '@/components/material-surplus-form';
import { ScrapSaleForm } from '@/components/scrap-sale-form';
import { CyclicCountForm } from '@/components/cyclic-count-form';
import { abcBadgeClass, effectiveClass, stockAddress, CLASS_ACCURACY_TARGET } from '@/lib/abc';
import { downloadCsv } from '@/lib/export-csv';
import { Plus, ArrowRightLeft, Trash2, Download, Undo2, PackageCheck, Recycle, Pencil, ClipboardCheck } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function StockPositionTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | undefined>();
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

  async function handleUpdate(data: StockItemInput) {
    if (!token || !editing) return;
    await api.updateStockItem(token, editing.id, {
      minQuantity: data.minQuantity, location: data.location,
      addrStreet: data.addrStreet, addrShelf: data.addrShelf, addrLevel: data.addrLevel, addrPosition: data.addrPosition,
      abcClass: data.abcClass, monthlyConsumption: data.monthlyConsumption,
      leadTimeDays: data.leadTimeDays, serviceLevelZ: data.serviceLevelZ,
    });
    setEditing(undefined);
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

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Cls</TableHead><TableHead>Material</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Quantidade</TableHead><TableHead>Mínimo</TableHead><TableHead>Endereço</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum item no estoque.</TableCell></TableRow>
            ) : items.map((item) => {
              const isLow = item.quantity <= item.minQuantity;
              const cls = effectiveClass(item);
              const addr = stockAddress(item);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold font-mono ${abcBadgeClass[cls]}`}>{cls}</span>
                  </TableCell>
                  <TableCell className="font-medium">{item.material.name}</TableCell>
                  <TableCell>{item.material.category}</TableCell>
                  <TableCell>{item.quantity} {item.material.unit}</TableCell>
                  <TableCell>{item.minQuantity} {item.material.unit}</TableCell>
                  <TableCell>
                    {addr
                      ? <span className="inline-block rounded border border-border bg-muted px-1.5 font-mono text-xs text-primary">{addr}</span>
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isLow ? 'bg-destructive/15 text-destructive' : 'bg-success/15 text-success'}`}>
                      {isLow ? 'Estoque Baixo' : 'OK'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Movimentar" onClick={() => { setMoving(item); setMoveOpen(true); }}>
                        <ArrowRightLeft size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" title="Editar mínimo/localização" onClick={() => setEditing(item)}>
                        <Pencil size={16} />
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

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Item de Estoque</DialogTitle></DialogHeader>
          {editing && <StockItemForm initialData={editing} onSubmit={handleUpdate} onCancel={() => setEditing(undefined)} />}
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
  PENDING: 'Pendente', RETURNED_TO_STOCK: 'Devolvida ao Estoque', KEPT_AT_PROJECT: 'Mantida no Projeto', SOLD_AS_SCRAP: 'Vendida como Sucata',
};
const surplusStatusColors: Record<string, string> = {
  PENDING: 'bg-warning/15 text-warning',
  RETURNED_TO_STOCK: 'bg-success/15 text-success',
  KEPT_AT_PROJECT: 'bg-info/15 text-info',
  SOLD_AS_SCRAP: 'bg-secondary text-secondary-foreground',
};
const destinationLabels: Record<string, string> = { ESTOQUE: 'Estoque', RETALHO: 'Retalho', SUCATA: 'Sucata' };
const destinationVariant: Record<string, 'success' | 'warning' | 'danger'> = { ESTOQUE: 'success', RETALHO: 'warning', SUCATA: 'danger' };

function SurplusTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<MaterialSurplus[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sellingScrap, setSellingScrap] = useState<MaterialSurplus | undefined>();

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

  async function handleSellAsScrap(data: ScrapSaleInput) {
    if (!token) return;
    await api.createScrapSale(token, data);
    setSellingScrap(undefined);
    load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Material comprado a mais do que foi usado em um projeto — devolva ao estoque geral, mantenha registrado como sobra no local, ou venda como sucata.</p>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Registrar Sobra</Button>
      </div>
      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead><TableHead>Material</TableHead><TableHead>Quantidade</TableHead>
              <TableHead>Destino</TableHead><TableHead>Local</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-48">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma sobra registrada.</TableCell></TableRow>
            ) : items.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.project.name}</TableCell>
                <TableCell className="font-medium">{s.material.name}{s.alloy ? ` (${s.alloy})` : ''}</TableCell>
                <TableCell>{s.quantity} {s.material.unit}</TableCell>
                <TableCell>{s.destination ? <Badge variant={destinationVariant[s.destination]}>{destinationLabels[s.destination]}</Badge> : '-'}</TableCell>
                <TableCell className="text-muted-foreground">{s.location || '-'}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${surplusStatusColors[s.status]}`}>{surplusStatusLabels[s.status]}</span></TableCell>
                <TableCell>
                  {s.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Devolver ao estoque" onClick={() => handleReturn(s)}><Undo2 size={16} /></Button>
                      <Button variant="ghost" size="icon" title="Manter no projeto" onClick={() => handleKeep(s)}><PackageCheck size={16} /></Button>
                      <Button variant="ghost" size="icon" title="Vender como sucata" onClick={() => setSellingScrap(s)}><Recycle size={16} /></Button>
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

      <Dialog open={!!sellingScrap} onOpenChange={(v) => !v && setSellingScrap(undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Vender Sobra como Sucata</DialogTitle></DialogHeader>
          {sellingScrap && (
            <ScrapSaleForm
              initialSurplusId={sellingScrap.id}
              onSubmit={handleSellAsScrap}
              onCancel={() => setSellingScrap(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReturnFromProjectTab() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [surpluses, setSurpluses] = useState<MaterialSurplus[]>([]);
  const [loading, setLoading] = useState(false);
  const [surplusOpen, setSurplusOpen] = useState(false);

  useEffect(() => { if (token) api.listProjects(token).then(setProjects); }, [token]);

  const load = useCallback(async () => {
    if (!token || !projectId) { setTools([]); setSurpluses([]); return; }
    setLoading(true);
    try {
      const [allTools, projectSurpluses] = await Promise.all([
        api.listTools(token),
        api.listMaterialSurpluses(token, { projectId }),
      ]);
      setTools(allTools.filter((t) => t.currentLocation === 'PROJECT' && t.currentProjectId === projectId));
      setSurpluses(projectSurpluses.filter((s) => s.status === 'PENDING'));
    } finally {
      setLoading(false);
    }
  }, [token, projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleReturnTool(tool: Tool) {
    if (!token || !confirm(`Devolver a ferramenta "${tool.name}" para a empresa?`)) return;
    await api.moveTool(token, tool.id, { toLocation: 'COMPANY' });
    load();
  }

  async function handleSurplusSubmit(data: MaterialSurplusInput) {
    if (!token) return;
    await api.createMaterialSurplus(token, data);
    setSurplusOpen(false);
    load();
  }

  async function handleResolveSurplus(s: MaterialSurplus, action: 'return' | 'keep') {
    if (!token) return;
    if (action === 'return') await api.returnMaterialSurplusToStock(token, s.id);
    else await api.keepMaterialSurplusAtProject(token, s.id);
    load();
  }

  const selectedProject = projects.find((p) => p.id === projectId);
  const allDone = projectId && tools.length === 0 && surpluses.length === 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Checklist de fechamento de obra: devolva as ferramentas que ainda estão no local e registre qualquer sobra de material encontrada.</p>
      <div className="space-y-2 w-96">
        <Label>Projeto/Obra</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione uma obra...">{selectedProject ? `${selectedProject.number} - ${selectedProject.name}` : undefined}</SelectValue></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!projectId ? (
        <p className="text-muted-foreground text-sm">Selecione uma obra para ver o checklist de retorno.</p>
      ) : loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : allDone ? (
        <p className="text-success text-sm">Nenhuma ferramenta pendente e nenhuma sobra em aberto para esta obra — retorno concluído.</p>
      ) : (
        <div className="space-y-6">
          {tools.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Ferramentas ainda na obra ({tools.length})</p>
              <div className="border rounded-md bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Ferramenta</TableHead><TableHead>Categoria</TableHead><TableHead className="w-32">Ações</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {tools.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-muted-foreground">{t.category}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleReturnTool(t)}><Undo2 size={14} className="mr-1" />Devolver</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Sobras de material pendentes ({surpluses.length})</p>
              <Button size="sm" variant="outline" onClick={() => setSurplusOpen(true)}><Plus size={14} className="mr-1" />Registrar Sobra</Button>
            </div>
            {surpluses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma sobra pendente para esta obra.</p>
            ) : (
              <div className="border rounded-md bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Material</TableHead><TableHead>Quantidade</TableHead><TableHead>Destino</TableHead><TableHead className="w-56">Ações</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {surpluses.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.material.name}</TableCell>
                        <TableCell>{s.quantity} {s.material.unit}</TableCell>
                        <TableCell>{s.destination ? <Badge variant={destinationVariant[s.destination]}>{destinationLabels[s.destination]}</Badge> : '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Devolver ao estoque" onClick={() => handleResolveSurplus(s, 'return')}><Undo2 size={16} /></Button>
                            <Button variant="ghost" size="icon" title="Manter no projeto" onClick={() => handleResolveSurplus(s, 'keep')}><PackageCheck size={16} /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={surplusOpen} onOpenChange={setSurplusOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Sobra de Material</DialogTitle></DialogHeader>
          <MaterialSurplusForm initialProjectId={projectId} onSubmit={handleSurplusSubmit} onCancel={() => setSurplusOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScrapSalesTab() {
  const { token } = useAuth();
  const [sales, setSales] = useState<ScrapSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setSales(await api.listScrapSales(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: ScrapSaleInput) {
    if (!token) return;
    await api.createScrapSale(token, data);
    setOpen(false);
    load();
  }

  const totalSold = sales.reduce((s, sale) => s + sale.totalValue, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Histórico de vendas de sucata — cada venda gera automaticamente um lançamento de receita já pago no Financeiro.</p>
      <div className="flex justify-between items-center">
        <p className="text-sm">Total vendido: <span className="font-semibold font-mono">{fmt(totalSold)}</span></p>
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Nova Venda de Sucata</Button>
      </div>
      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Peso</TableHead>
              <TableHead>Comprador</TableHead><TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : sales.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma venda de sucata registrada.</TableCell></TableRow>
            ) : sales.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{new Date(s.saleDate).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="font-medium">{s.description}</TableCell>
                <TableCell>{s.weightKg ? `${s.weightKg} kg` : '-'}</TableCell>
                <TableCell>{s.buyerName || '-'}</TableCell>
                <TableCell className="font-semibold">{fmt(s.totalValue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Venda de Sucata</DialogTitle></DialogHeader>
          <ScrapSaleForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
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

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

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
        <p className="text-sm text-muted-foreground">Materiais abaixo do mínimo, com quantidade sugerida para repor até o nível mínimo.</p>
        <Button variant="outline" disabled={belowMinimum.length === 0} onClick={handleExport}>
          <Download size={16} className="mr-2" />Exportar CSV
        </Button>
      </div>
      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead><TableHead>Estoque Atual</TableHead><TableHead>Mínimo</TableHead>
              <TableHead>Qtd. Sugerida</TableHead><TableHead>Custo Estimado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {belowMinimum.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum item abaixo do mínimo no momento.</TableCell></TableRow>
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

function CyclicInventoryTab() {
  const { token } = useAuth();
  const [history, setHistory] = useState<CyclicCount[]>([]);
  const [plan, setPlan] = useState<CyclicCountPlan | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [h, p, e] = await Promise.all([
        api.listCyclicCounts(token),
        api.getCyclicCountPlan(token),
        api.listEmployees(token),
      ]);
      setHistory(h); setPlan(p); setEmployees(e);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: CyclicCountInput) {
    if (!token) return;
    await api.createCyclicCount(token, data);
    setOpen(false);
    load();
  }

  if (loading || !plan) return <p className="text-muted-foreground">Carregando...</p>;

  const year = new Date().getFullYear().toString();
  const thisYear = history.filter((c) => c.countDate.startsWith(year));
  const accuracyAvg = thisYear.length ? thisYear.reduce((a, c) => a + c.accuracyPct, 0) / thisYear.length : 0;
  const itemsCounted = thisYear.reduce((a, c) => a + c.totalItems, 0);
  const adjustmentYear = thisYear.reduce((a, c) => a + Math.abs(c.adjustmentValue), 0);
  const overdue = plan.buckets.D.length;

  const byClass = (['A', 'B', 'C'] as const).map((cl) => {
    const cs = history.filter((c) => c.className === cl);
    const m = cs.length ? cs.reduce((a, c) => a + c.accuracyPct, 0) / cs.length : null;
    return { cl, n: plan.buckets[cl].length, m, target: CLASS_ACCURACY_TARGET[cl] };
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border-l-2 border-primary bg-muted/40 p-3 text-xs leading-relaxed">
        <strong className="text-primary">Contagem cega.</strong> O sistema não mostra o saldo enquanto você conta.
        Frequência: classe A todo mês · classe B a cada 3 meses · classe C a cada 6 meses. Poucos itens por dia, sem parar a operação.
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Nova Contagem</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-md border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Acuracidade média do ano</p>
          <p className={`text-2xl font-bold font-mono ${accuracyAvg >= 95 ? 'text-success' : accuracyAvg >= 90 ? 'text-warning' : 'text-destructive'}`}>{thisYear.length ? `${accuracyAvg.toFixed(1)}%` : '—'}</p>
          <p className="text-[10px] text-muted-foreground">Meta 95% · classe A 98%</p>
        </div>
        <div className="rounded-md border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Contagens no ano</p>
          <p className="text-2xl font-bold font-mono">{thisYear.length}</p>
          <p className="text-[10px] text-muted-foreground">{itemsCounted} item(ns) contado(s)</p>
        </div>
        <div className="rounded-md border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Vencidos para contagem</p>
          <p className={`text-2xl font-bold font-mono ${overdue ? 'text-warning' : 'text-success'}`}>{overdue}</p>
          <p className="text-[10px] text-muted-foreground">de {plan.buckets.A.length + plan.buckets.B.length + plan.buckets.C.length} itens</p>
        </div>
        <div className="rounded-md border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ajuste acumulado</p>
          <p className="text-lg font-bold font-mono text-destructive">{fmt(adjustmentYear)}</p>
          <p className="text-[10px] text-muted-foreground">Divergência em valor absoluto</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-md border bg-card p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-3">Acuracidade por classe</p>
          <div className="space-y-3">
            {byClass.map(({ cl, n, m, target }) => {
              const color = m == null ? 'text-muted-foreground' : m >= target ? 'text-success' : m >= target - 5 ? 'text-warning' : 'text-destructive';
              return (
                <div key={cl}>
                  <div className="flex justify-between text-xs mb-1">
                    <span><span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold font-mono ${abcBadgeClass[cl]}`}>{cl}</span> <span className="ml-2">{n} itens · meta {target}%</span></span>
                    <span className={`font-mono ${color}`}>{m != null ? `${m.toFixed(1)}%` : 'sem contagem'}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${m ?? 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-3">Itens vencidos para contagem</p>
          {plan.buckets.D.length === 0 ? (
            <p className="text-sm text-success">✓ Nenhum item vencido para contagem.</p>
          ) : (
            <div className="space-y-1 text-xs">
              {plan.buckets.D.slice(0, 8).map((it) => (
                <div key={it.id} className="flex justify-between border-b py-1">
                  <span><span className={`inline-flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold font-mono ${abcBadgeClass[it.className]}`}>{it.className}</span> <span className="ml-1.5">{it.name}</span></span>
                  <span className="text-muted-foreground">{it.daysSince == null ? 'nunca contado' : `há ${it.daysSince} dias`}</span>
                </div>
              ))}
              {plan.buckets.D.length > 8 && <p className="text-muted-foreground pt-1">+ {plan.buckets.D.length - 8} item(ns)</p>}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Histórico de contagens</p>
        <Button size="sm" variant="outline" disabled={history.length === 0} onClick={() => downloadCsv('contagens-ciclicas.csv', [
          ['Data', 'Classe', 'Itens', 'Certos', 'Divergentes', 'Acuracidade %', 'Ajuste R$', 'Responsável'],
          ...history.map((c) => [new Date(c.countDate).toLocaleDateString('pt-BR'), c.className, c.totalItems, c.correctItems, c.divergentItems, c.accuracyPct, c.adjustmentValue, c.responsible?.name || '']),
        ])}><Download size={14} className="mr-1" />CSV</Button>
      </div>
      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead><TableHead>Classe</TableHead><TableHead>Itens</TableHead>
              <TableHead>Certos</TableHead><TableHead>Divergentes</TableHead><TableHead>Acuracidade</TableHead>
              <TableHead>Ajuste (R$)</TableHead><TableHead>Responsável</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Nenhuma contagem registrada.</TableCell></TableRow>
            ) : history.map((c) => {
              const target = c.className === 'D' ? 95 : CLASS_ACCURACY_TARGET[c.className as 'A' | 'B' | 'C'];
              return (
                <TableRow key={c.id}>
                  <TableCell>{new Date(c.countDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold font-mono ${abcBadgeClass[(c.className === 'D' ? 'A' : c.className) as 'A' | 'B' | 'C']}`}>{c.className}</span></TableCell>
                  <TableCell className="font-mono">{c.totalItems}</TableCell>
                  <TableCell className="font-mono text-success">{c.correctItems}</TableCell>
                  <TableCell className={`font-mono ${c.divergentItems ? 'text-destructive' : 'text-muted-foreground'}`}>{c.divergentItems}</TableCell>
                  <TableCell className={`font-mono ${c.accuracyPct >= target ? 'text-success' : 'text-warning'}`}>{c.accuracyPct.toFixed(1)}%</TableCell>
                  <TableCell className="font-mono">{fmt(c.adjustmentValue)}</TableCell>
                  <TableCell className="text-xs">{c.responsible?.name?.split(' ')[0] || '—'}</TableCell>
                  <TableCell>{c.pendingItems && c.pendingItems.length > 0
                    ? <Badge variant="danger" title={c.pendingItems.join(', ')}>{c.pendingItems.length} pend.</Badge>
                    : <Badge variant="success">OK</Badge>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Contagem Cíclica</DialogTitle></DialogHeader>
          <CyclicCountForm plan={plan} employees={employees} onSubmit={handleCreate} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EstoquePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estoque</h1>
        <p className="text-muted-foreground">Posição de estoque, inventário cíclico, sobras de projeto e lista de reposição.</p>
      </div>

      <Tabs defaultValue="posicao">
        <TabsList>
          <TabsTrigger value="posicao">Posição</TabsTrigger>
          <TabsTrigger value="inventario"><ClipboardCheck size={14} className="mr-1" />Inventário Cíclico</TabsTrigger>
          <TabsTrigger value="sobras">Sobras</TabsTrigger>
          <TabsTrigger value="retorno">Retorno de Obra</TabsTrigger>
          <TabsTrigger value="sucata">Sucata</TabsTrigger>
          <TabsTrigger value="reposicao">Lista de Reposição</TabsTrigger>
        </TabsList>
        <TabsContent value="posicao"><StockPositionTab /></TabsContent>
        <TabsContent value="inventario"><CyclicInventoryTab /></TabsContent>
        <TabsContent value="sobras"><SurplusTab /></TabsContent>
        <TabsContent value="retorno"><ReturnFromProjectTab /></TabsContent>
        <TabsContent value="sucata"><ScrapSalesTab /></TabsContent>
        <TabsContent value="reposicao"><ReplenishmentTab /></TabsContent>
      </Tabs>
    </div>
  );
}
