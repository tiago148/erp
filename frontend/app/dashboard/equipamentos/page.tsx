'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  api, Vehicle, VehicleInput, WorkSite, WorkSiteInput, Tool, ToolInput, MoveToolInput,
  VehicleTrip, VehicleTripInput, VehicleTripType, CloseVehicleTripInput, VehicleMaintenance, VehicleMaintenanceInput,
  ToolMaintenance, ToolMaintenanceInput, TrackedDocument, TrackedDocumentInput,
  MaintenancePlan, MaintenancePlanInput, MaintenanceTargetType,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { VehicleForm } from '@/components/vehicle-form';
import { WorkSiteForm } from '@/components/work-site-form';
import { ToolForm } from '@/components/tool-form';
import { MoveToolForm } from '@/components/move-tool-form';
import { VehicleTripForm } from '@/components/vehicle-trip-form';
import { VehicleTripCloseForm } from '@/components/vehicle-trip-close-form';
import { VehicleMaintenanceForm } from '@/components/vehicle-maintenance-form';
import { ToolMaintenanceForm } from '@/components/tool-maintenance-form';
import { DocumentForm } from '@/components/document-form';
import { MaintenancePlanForm } from '@/components/maintenance-plan-form';
import { Plus, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function VehiclesTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listVehicles(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: VehicleInput) {
    if (!token) return;
    if (editing) await api.updateVehicle(token, editing.id, data);
    else await api.createVehicle(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(v: Vehicle) {
    if (!token || !confirm(`Excluir "${v.name}"?`)) return;
    await api.deleteVehicle(token, v.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Novo Veículo</Button>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Placa</TableHead><TableHead>Tipo</TableHead>
              <TableHead>Consumo (km/l)</TableHead><TableHead>KM Atual</TableHead><TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum veículo cadastrado.</TableCell></TableRow>
            ) : items.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell>{v.plate}</TableCell>
                <TableCell>{v.type}</TableCell>
                <TableCell>{v.avgConsumption}</TableCell>
                <TableCell>{v.currentKm.toLocaleString('pt-BR')} km</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(v); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(v)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle></DialogHeader>
          <VehicleForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkSitesTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<WorkSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkSite | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listWorkSites(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: WorkSiteInput) {
    if (!token) return;
    if (editing) await api.updateWorkSite(token, editing.id, data);
    else await api.createWorkSite(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(w: WorkSite) {
    if (!token || !confirm(`Excluir "${w.name}"?`)) return;
    await api.deleteWorkSite(token, w.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Novo Local</Button>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Cliente</TableHead><TableHead>Endereço</TableHead>
              <TableHead>Distância</TableHead><TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum local cadastrado.</TableCell></TableRow>
            ) : items.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{w.name}</TableCell>
                <TableCell>{w.client?.name}</TableCell>
                <TableCell>{w.address}</TableCell>
                <TableCell>{w.distanceKm ? `${w.distanceKm} km` : '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(w); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(w)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Local' : 'Novo Local de Obra'}</DialogTitle></DialogHeader>
          <WorkSiteForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolsTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [editing, setEditing] = useState<Tool | undefined>();
  const [moving, setMoving] = useState<Tool | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listTools(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: ToolInput) {
    if (!token) return;
    if (editing) await api.updateTool(token, editing.id, data);
    else await api.createTool(token, data);
    setOpen(false);
    load();
  }

  async function handleMove(data: MoveToolInput) {
    if (!token || !moving) return;
    await api.moveTool(token, moving.id, data);
    setMoveOpen(false);
    load();
  }

  async function handleDelete(t: Tool) {
    if (!token || !confirm(`Excluir "${t.name}"?`)) return;
    await api.deleteTool(token, t.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Nova Ferramenta</Button>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Custódia</TableHead><TableHead>Localização Atual</TableHead><TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma ferramenta cadastrada.</TableCell></TableRow>
            ) : items.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.code || '-'}</TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${t.custody === 'INDIVIDUAL' ? 'bg-info/15 text-info' : t.custody === 'FIXED' ? 'bg-muted text-muted-foreground' : 'bg-warning/15 text-warning'}`}>
                    {t.custody === 'INDIVIDUAL' ? 'Individual' : t.custody === 'FIXED' ? 'Fixa' : 'Compartilhada'}
                  </span>
                  {t.custody === 'INDIVIDUAL' && t.responsibleEmployee && (
                    <span className="ml-1.5 text-[10px] text-primary">{t.responsibleEmployee.name.split(' ')[0]}</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.currentLocation === 'COMPANY' ? 'bg-secondary text-secondary-foreground' : 'bg-info/15 text-info'}`}>
                    {t.currentLocation === 'COMPANY' ? 'Empresa' : t.currentProject?.name || 'Projeto'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Mover" onClick={() => { setMoving(t); setMoveOpen(true); }}><ArrowRightLeft size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Ferramenta' : 'Nova Ferramenta'}</DialogTitle></DialogHeader>
          <ToolForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Mover Ferramenta: {moving?.name}</DialogTitle></DialogHeader>
          {moving && <MoveToolForm tool={moving} onSubmit={handleMove} onCancel={() => setMoveOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VehicleSelector({ vehicles, vehicleId, onChange }: { vehicles: Vehicle[]; vehicleId: string; onChange: (id: string) => void }) {
  const selected = vehicles.find((v) => v.id === vehicleId);
  return (
    <div className="space-y-2 w-72">
      <Label>Veículo</Label>
      <Select value={vehicleId} onValueChange={onChange}>
        <SelectTrigger className="w-full"><SelectValue placeholder="Selecione um veículo...">{selected ? `${selected.name} (${selected.plate})` : undefined}</SelectValue></SelectTrigger>
        <SelectContent>
          {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} ({v.plate})</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

const tripTypeLabels: Record<VehicleTripType, string> = {
  FRETE: 'Frete', ENTREGA: 'Entrega', COLETA: 'Coleta', COMPRA: 'Compra', VISITA: 'Visita', OUTRO: 'Outro',
};

function VehicleTripsTab() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [trips, setTrips] = useState<VehicleTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState<VehicleTrip | undefined>();

  useEffect(() => { if (token) api.listVehicles(token).then(setVehicles); }, [token]);

  const load = useCallback(async () => {
    if (!token || !vehicleId) { setTrips([]); return; }
    setLoading(true);
    try { setTrips(await api.listVehicleTrips(token, vehicleId)); } finally { setLoading(false); }
  }, [token, vehicleId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: VehicleTripInput) {
    if (!token) return;
    await api.createVehicleTrip(token, data);
    setOpen(false);
    load();
  }

  async function handleClose(data: CloseVehicleTripInput) {
    if (!token || !closing) return;
    await api.closeVehicleTrip(token, closing.id, data);
    setClosing(undefined);
    load();
    api.listVehicles(token).then(setVehicles);
  }

  async function handleDelete(trip: VehicleTrip) {
    if (!token || !confirm(`Excluir a viagem aberta "${trip.origin} → ${trip.destination}"?`)) return;
    await api.deleteVehicleTrip(token, trip.id);
    load();
  }

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <VehicleSelector vehicles={vehicles} vehicleId={vehicleId} onChange={setVehicleId} />
        <Button disabled={!vehicleId} onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Abrir Viagem</Button>
      </div>

      {selectedVehicle && <p className="text-sm text-muted-foreground">KM atual: <span className="font-medium">{selectedVehicle.currentKm.toLocaleString('pt-BR')} km</span></p>}

      {!vehicleId ? (
        <p className="text-muted-foreground text-sm">Selecione um veículo para ver o histórico de viagens.</p>
      ) : (
        <div className="border rounded-md bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Origem</TableHead><TableHead>Destino</TableHead>
                <TableHead>Motorista</TableHead><TableHead>Projeto</TableHead><TableHead>KM</TableHead>
                <TableHead>Pedágio</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : trips.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Nenhuma viagem registrada.</TableCell></TableRow>
              ) : trips.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{fmtDate(t.date)}</TableCell>
                  <TableCell>{tripTypeLabels[t.type]}</TableCell>
                  <TableCell>{t.origin}</TableCell>
                  <TableCell>{t.destination}</TableCell>
                  <TableCell>{t.driver?.name || '-'}</TableCell>
                  <TableCell>{t.project?.name || '-'}</TableCell>
                  <TableCell className="font-medium">{t.status === 'CLOSED' ? `${t.distanceKm} km` : '-'}</TableCell>
                  <TableCell>{t.status === 'CLOSED' && t.tollCost > 0 ? fmtCurrency(t.tollCost) : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'OPEN' ? 'warning' : 'success'}>{t.status === 'OPEN' ? 'Aberta' : 'Fechada'}</Badge>
                  </TableCell>
                  <TableCell>
                    {t.status === 'OPEN' && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setClosing(t)}>Fechar</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t)}><Trash2 size={16} /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Abrir Viagem</DialogTitle></DialogHeader>
          {vehicleId && selectedVehicle && <VehicleTripForm vehicleId={vehicleId} currentKm={selectedVehicle.currentKm} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!closing} onOpenChange={(v) => !v && setClosing(undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Fechar Viagem</DialogTitle></DialogHeader>
          {closing && <VehicleTripCloseForm trip={closing} onSubmit={handleClose} onCancel={() => setClosing(undefined)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VehicleMaintenancesTab() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [items, setItems] = useState<VehicleMaintenance[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleMaintenance | undefined>();

  useEffect(() => { if (token) api.listVehicles(token).then(setVehicles); }, [token]);

  const load = useCallback(async () => {
    if (!token || !vehicleId) { setItems([]); return; }
    setLoading(true);
    try { setItems(await api.listVehicleMaintenances(token, vehicleId)); } finally { setLoading(false); }
  }, [token, vehicleId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: VehicleMaintenanceInput) {
    if (!token) return;
    if (editing) await api.updateVehicleMaintenance(token, editing.id, data);
    else await api.createVehicleMaintenance(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(m: VehicleMaintenance) {
    if (!token || !confirm(`Excluir o registro de manutenção "${m.type}"?`)) return;
    await api.deleteVehicleMaintenance(token, m.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <VehicleSelector vehicles={vehicles} vehicleId={vehicleId} onChange={setVehicleId} />
        <Button disabled={!vehicleId} onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Nova Manutenção</Button>
      </div>

      {!vehicleId ? (
        <p className="text-muted-foreground text-sm">Selecione um veículo para ver o histórico de manutenções.</p>
      ) : (
        <div className="border rounded-md bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>KM</TableHead>
                <TableHead>Fornecedor/Oficina</TableHead><TableHead>Custo</TableHead><TableHead>Lançamento</TableHead><TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma manutenção registrada.</TableCell></TableRow>
              ) : items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{fmtDate(m.date)}</TableCell>
                  <TableCell className="font-medium">{m.type}</TableCell>
                  <TableCell>{m.km.toLocaleString('pt-BR')} km</TableCell>
                  <TableCell>{m.supplierName || '-'}</TableCell>
                  <TableCell>{fmtCurrency(m.cost)}</TableCell>
                  <TableCell>
                    {m.financeEntry ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.financeEntry.status === 'PAID' ? 'bg-success/15 text-success' : m.financeEntry.status === 'CANCELLED' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}`}>
                        {m.financeEntry.status === 'PAID' ? 'Pago' : m.financeEntry.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setOpen(true); }}><Pencil size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m)}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Manutenção' : 'Nova Manutenção'}</DialogTitle></DialogHeader>
          {vehicleId && <VehicleMaintenanceForm vehicleId={vehicleId} initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolSelector({ tools, toolId, onChange }: { tools: Tool[]; toolId: string; onChange: (id: string) => void }) {
  const selected = tools.find((t) => t.id === toolId);
  return (
    <div className="space-y-2 w-72">
      <Label>Ferramenta</Label>
      <Select value={toolId} onValueChange={onChange}>
        <SelectTrigger className="w-full"><SelectValue placeholder="Selecione uma ferramenta...">{selected?.name}</SelectValue></SelectTrigger>
        <SelectContent>
          {tools.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToolMaintenancesTab() {
  const { token } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolId, setToolId] = useState('');
  const [items, setItems] = useState<ToolMaintenance[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ToolMaintenance | undefined>();

  useEffect(() => { if (token) api.listTools(token).then(setTools); }, [token]);

  const load = useCallback(async () => {
    if (!token || !toolId) { setItems([]); return; }
    setLoading(true);
    try { setItems(await api.listToolMaintenances(token, toolId)); } finally { setLoading(false); }
  }, [token, toolId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: ToolMaintenanceInput) {
    if (!token) return;
    if (editing) await api.updateToolMaintenance(token, editing.id, data);
    else await api.createToolMaintenance(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(m: ToolMaintenance) {
    if (!token || !confirm(`Excluir o registro de manutenção "${m.type}"?`)) return;
    await api.deleteToolMaintenance(token, m.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <ToolSelector tools={tools} toolId={toolId} onChange={setToolId} />
        <Button disabled={!toolId} onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Nova Manutenção</Button>
      </div>

      {!toolId ? (
        <p className="text-muted-foreground text-sm">Selecione uma ferramenta para ver o histórico de manutenções.</p>
      ) : (
        <div className="border rounded-md bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Fornecedor/Oficina</TableHead><TableHead>Custo</TableHead><TableHead>Lançamento</TableHead><TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma manutenção registrada.</TableCell></TableRow>
              ) : items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{fmtDate(m.date)}</TableCell>
                  <TableCell className="font-medium">{m.type}</TableCell>
                  <TableCell>{m.supplierName || '-'}</TableCell>
                  <TableCell>{fmtCurrency(m.cost)}</TableCell>
                  <TableCell>
                    {m.financeEntry ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.financeEntry.status === 'PAID' ? 'bg-success/15 text-success' : m.financeEntry.status === 'CANCELLED' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}`}>
                        {m.financeEntry.status === 'PAID' ? 'Pago' : m.financeEntry.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setOpen(true); }}><Pencil size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m)}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Manutenção' : 'Nova Manutenção'}</DialogTitle></DialogHeader>
          {toolId && <ToolMaintenanceForm toolId={toolId} initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const maintenanceLevelVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  OK: 'success', ATENCAO: 'warning', VENCIDO: 'danger',
};
const maintenanceLevelLabels: Record<string, string> = {
  OK: 'Em dia', ATENCAO: 'Atenção', VENCIDO: 'Vencida',
};
const maintenanceTargetTypeLabels: Record<MaintenanceTargetType, string> = { VEHICLE: 'Veículo', TOOL: 'Ferramenta' };

function MaintenancePlansTab() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenancePlan | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setPlans(await api.listMaintenancePlans(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: MaintenancePlanInput) {
    if (!token) return;
    if (editing) await api.updateMaintenancePlan(token, editing.id, data);
    else await api.createMaintenancePlan(token, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleMarkServiced(plan: MaintenancePlan) {
    if (!token || !confirm(`Registrar que a revisão "${plan.name}" foi executada agora?`)) return;
    await api.markMaintenancePlanServiced(token, plan.id);
    load();
  }

  async function handleDelete(plan: MaintenancePlan) {
    if (!token || !confirm(`Excluir o plano de revisão "${plan.name}"?`)) return;
    await api.deleteMaintenancePlan(token, plan.id);
    load();
  }

  function nextDueLabel(plan: MaintenancePlan) {
    if (plan.intervalType === 'KM') {
      return plan.nextDueKm !== null ? `${plan.nextDueKm.toLocaleString('pt-BR')} km${plan.kmRemaining !== null ? ` (faltam ${plan.kmRemaining.toLocaleString('pt-BR')} km)` : ''}` : '-';
    }
    return plan.nextDueDate ? `${fmtDate(plan.nextDueDate)}${plan.daysRemaining !== null ? ` (${plan.daysRemaining} dia(s))` : ''}` : '-';
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Novo Plano de Revisão</Button>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bem</TableHead><TableHead>Revisão</TableHead><TableHead>Intervalo</TableHead>
              <TableHead>Próxima</TableHead><TableHead>Status</TableHead><TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : plans.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum plano de revisão cadastrado.</TableCell></TableRow>
            ) : plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.targetLabel} <span className="text-xs text-muted-foreground">({maintenanceTargetTypeLabels[plan.targetType]})</span></TableCell>
                <TableCell>{plan.name}</TableCell>
                <TableCell className="text-muted-foreground">{plan.intervalType === 'KM' ? `${plan.intervalKm?.toLocaleString('pt-BR')} km` : `${plan.intervalMonths} mês(es)`}</TableCell>
                <TableCell className="text-sm">{nextDueLabel(plan)}</TableCell>
                <TableCell><Badge variant={maintenanceLevelVariant[plan.level]}>{maintenanceLevelLabels[plan.level]}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleMarkServiced(plan)}>Feito</Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(plan); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(plan)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Plano de Revisão' : 'Novo Plano de Revisão'}</DialogTitle></DialogHeader>
          <MaintenancePlanForm initialData={editing} onSubmit={handleSubmit} onCancel={() => { setOpen(false); setEditing(undefined); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MaintenancesTab() {
  const [equipmentType, setEquipmentType] = useState<'vehicle' | 'tool' | 'plans'>('vehicle');
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={equipmentType === 'vehicle' ? 'default' : 'outline'} size="sm" onClick={() => setEquipmentType('vehicle')}>Veículos</Button>
        <Button variant={equipmentType === 'tool' ? 'default' : 'outline'} size="sm" onClick={() => setEquipmentType('tool')}>Ferramentas</Button>
        <Button variant={equipmentType === 'plans' ? 'default' : 'outline'} size="sm" onClick={() => setEquipmentType('plans')}>Revisões</Button>
      </div>
      {equipmentType === 'vehicle' ? <VehicleMaintenancesTab /> : equipmentType === 'tool' ? <ToolMaintenancesTab /> : <MaintenancePlansTab />}
    </div>
  );
}

const targetTypeLabels: Record<string, string> = {
  VEHICLE: 'Veículo',
  EMPLOYEE: 'Funcionário',
  TOOL: 'Ferramenta',
  COMPANY: 'Empresa',
};

function documentDaysLeft(expiresAt: string) {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function DocumentsTab() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<TrackedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TrackedDocument | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setDocuments(await api.listDocuments(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: TrackedDocumentInput) {
    if (!token) return;
    await api.createDocument(token, data);
    setOpen(false);
    load();
  }

  async function handleUpdate(data: TrackedDocumentInput) {
    if (!token || !editing) return;
    await api.updateDocument(token, editing.id, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleDelete(document: TrackedDocument) {
    if (!token || !confirm(`Excluir o documento "${document.title}" de ${document.targetLabel}?`)) return;
    await api.deleteDocument(token, document.id);
    load();
  }

  const sorted = [...documents].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Documentos com vencimento de veículos, funcionários, ferramentas e da empresa.</p>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus size={16} className="mr-2" />Novo Documento
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vinculado a</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : sorted.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum documento cadastrado.</TableCell></TableRow>
            ) : (
              sorted.map((doc) => {
                const d = documentDaysLeft(doc.expiresAt);
                return (
                  <TableRow key={doc.id}>
                    <TableCell>{targetTypeLabels[doc.targetType]}: {doc.targetLabel}</TableCell>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell className="text-muted-foreground">{doc.documentNumber || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{new Date(doc.expiresAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                    <TableCell>
                      <Badge variant={d < 0 ? 'danger' : d <= 30 ? 'warning' : 'success'}>
                        {d < 0 ? `Vencido há ${Math.abs(d)}d` : d <= 30 ? `Vence em ${d}d` : 'Em dia'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(doc); setOpen(true); }}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Documento' : 'Novo Documento'}</DialogTitle></DialogHeader>
          <DocumentForm
            initialData={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setOpen(false); setEditing(undefined); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EquipamentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Equipamentos & Logística</h1>
        <p className="text-muted-foreground">Veículos, ferramentas, locais de obra e documentos.</p>
      </div>

      <Tabs defaultValue="ferramentas">
        <TabsList>
          <TabsTrigger value="ferramentas">Ferramentas</TabsTrigger>
          <TabsTrigger value="veiculos">Veículos</TabsTrigger>
          <TabsTrigger value="locais">Locais de Obra</TabsTrigger>
          <TabsTrigger value="manutencoes">Manutenções</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="ferramentas"><ToolsTab /></TabsContent>
        <TabsContent value="veiculos"><VehiclesTab /></TabsContent>
        <TabsContent value="locais"><WorkSitesTab /></TabsContent>
        <TabsContent value="manutencoes"><MaintenancesTab /></TabsContent>
        <TabsContent value="documentos"><DocumentsTab /></TabsContent>
        <TabsContent value="historico"><VehicleTripsTab /></TabsContent>
      </Tabs>
    </div>
  );
}