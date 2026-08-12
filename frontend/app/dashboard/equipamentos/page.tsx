'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  api, Vehicle, VehicleInput, WorkSite, WorkSiteInput, Tool, ToolInput, MoveToolInput,
  VehicleTrip, VehicleTripInput, VehicleMaintenance, VehicleMaintenanceInput,
  ToolMaintenance, ToolMaintenanceInput,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleForm } from '@/components/vehicle-form';
import { WorkSiteForm } from '@/components/work-site-form';
import { ToolForm } from '@/components/tool-form';
import { MoveToolForm } from '@/components/move-tool-form';
import { VehicleTripForm } from '@/components/vehicle-trip-form';
import { VehicleMaintenanceForm } from '@/components/vehicle-maintenance-form';
import { ToolMaintenanceForm } from '@/components/tool-maintenance-form';
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
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Placa</TableHead><TableHead>Tipo</TableHead>
              <TableHead>Consumo (km/l)</TableHead><TableHead>KM Atual</TableHead><TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Nenhum veículo cadastrado.</TableCell></TableRow>
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
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Cliente</TableHead><TableHead>Endereço</TableHead>
              <TableHead>Distância</TableHead><TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Nenhum local cadastrado.</TableCell></TableRow>
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
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Localização Atual</TableHead><TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Nenhuma ferramenta cadastrada.</TableCell></TableRow>
            ) : items.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.code || '-'}</TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.currentLocation === 'COMPANY' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
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

function VehicleTripsTab() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [trips, setTrips] = useState<VehicleTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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
    api.listVehicles(token).then(setVehicles);
  }

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <VehicleSelector vehicles={vehicles} vehicleId={vehicleId} onChange={setVehicleId} />
        <Button disabled={!vehicleId} onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Nova Movimentação</Button>
      </div>

      {selectedVehicle && <p className="text-sm text-gray-500">KM atual: <span className="font-medium">{selectedVehicle.currentKm.toLocaleString('pt-BR')} km</span></p>}

      {!vehicleId ? (
        <p className="text-gray-500 text-sm">Selecione um veículo para ver o histórico de viagens.</p>
      ) : (
        <div className="border rounded-md bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Origem</TableHead><TableHead>Destino</TableHead>
                <TableHead>Finalidade</TableHead><TableHead>Motorista</TableHead><TableHead>Projeto</TableHead><TableHead>KM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
              ) : trips.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500">Nenhuma movimentação registrada.</TableCell></TableRow>
              ) : trips.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{fmtDate(t.date)}</TableCell>
                  <TableCell>{t.origin}</TableCell>
                  <TableCell>{t.destination}</TableCell>
                  <TableCell>{t.purpose || '-'}</TableCell>
                  <TableCell>{t.driver?.name || '-'}</TableCell>
                  <TableCell>{t.project?.name || '-'}</TableCell>
                  <TableCell className="font-medium">{t.distanceKm} km</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nova Movimentação</DialogTitle></DialogHeader>
          {vehicleId && <VehicleTripForm vehicleId={vehicleId} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />}
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
        <p className="text-gray-500 text-sm">Selecione um veículo para ver o histórico de manutenções.</p>
      ) : (
        <div className="border rounded-md bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>KM</TableHead>
                <TableHead>Fornecedor/Oficina</TableHead><TableHead>Custo</TableHead><TableHead>Lançamento</TableHead><TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500">Nenhuma manutenção registrada.</TableCell></TableRow>
              ) : items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{fmtDate(m.date)}</TableCell>
                  <TableCell className="font-medium">{m.type}</TableCell>
                  <TableCell>{m.km.toLocaleString('pt-BR')} km</TableCell>
                  <TableCell>{m.supplierName || '-'}</TableCell>
                  <TableCell>{fmtCurrency(m.cost)}</TableCell>
                  <TableCell>
                    {m.financeEntry ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.financeEntry.status === 'PAID' ? 'bg-green-100 text-green-700' : m.financeEntry.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
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
        <p className="text-gray-500 text-sm">Selecione uma ferramenta para ver o histórico de manutenções.</p>
      ) : (
        <div className="border rounded-md bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Fornecedor/Oficina</TableHead><TableHead>Custo</TableHead><TableHead>Lançamento</TableHead><TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Nenhuma manutenção registrada.</TableCell></TableRow>
              ) : items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{fmtDate(m.date)}</TableCell>
                  <TableCell className="font-medium">{m.type}</TableCell>
                  <TableCell>{m.supplierName || '-'}</TableCell>
                  <TableCell>{fmtCurrency(m.cost)}</TableCell>
                  <TableCell>
                    {m.financeEntry ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.financeEntry.status === 'PAID' ? 'bg-green-100 text-green-700' : m.financeEntry.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
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

function MaintenancesTab() {
  const [equipmentType, setEquipmentType] = useState<'vehicle' | 'tool'>('vehicle');
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={equipmentType === 'vehicle' ? 'default' : 'outline'} size="sm" onClick={() => setEquipmentType('vehicle')}>Veículos</Button>
        <Button variant={equipmentType === 'tool' ? 'default' : 'outline'} size="sm" onClick={() => setEquipmentType('tool')}>Ferramentas</Button>
      </div>
      {equipmentType === 'vehicle' ? <VehicleMaintenancesTab /> : <ToolMaintenancesTab />}
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return <p className="text-center text-gray-400 py-12">{label} — em breve.</p>;
}

export default function EquipamentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Equipamentos & Logística</h1>
        <p className="text-gray-500">Veículos, ferramentas, locais de obra e documentos.</p>
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
        <TabsContent value="documentos"><ComingSoon label="Documentos" /></TabsContent>
        <TabsContent value="historico"><VehicleTripsTab /></TabsContent>
      </Tabs>
    </div>
  );
}