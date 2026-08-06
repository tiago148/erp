'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Vehicle, VehicleInput, WorkSite, WorkSiteInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleForm } from '@/components/vehicle-form';
import { WorkSiteForm } from '@/components/work-site-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';

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
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus size={16} className="mr-2" />Novo Veículo
        </Button>
      </div>
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Placa</TableHead><TableHead>Tipo</TableHead>
              <TableHead>Consumo (km/l)</TableHead><TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Nenhum veículo cadastrado.</TableCell></TableRow>
            ) : items.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell>{v.plate}</TableCell>
                <TableCell>{v.type}</TableCell>
                <TableCell>{v.avgConsumption}</TableCell>
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
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus size={16} className="mr-2" />Novo Local
        </Button>
      </div>
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Cliente</TableHead><TableHead>Endereço</TableHead>
              <TableHead>Cidade/UF</TableHead><TableHead className="w-24">Ações</TableHead>
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
                <TableCell>{w.city ? `${w.city}/${w.state || ''}` : '-'}</TableCell>
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

      <Tabs defaultValue="veiculos">
        <TabsList>
          <TabsTrigger value="ferramentas">Ferramentas</TabsTrigger>
          <TabsTrigger value="veiculos">Veículos</TabsTrigger>
          <TabsTrigger value="locais">Locais de Obra</TabsTrigger>
          <TabsTrigger value="manutencoes">Manutenções</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="ferramentas"><ComingSoon label="Ferramentas" /></TabsContent>
        <TabsContent value="veiculos"><VehiclesTab /></TabsContent>
        <TabsContent value="locais"><WorkSitesTab /></TabsContent>
        <TabsContent value="manutencoes"><ComingSoon label="Manutenções" /></TabsContent>
        <TabsContent value="documentos"><ComingSoon label="Documentos" /></TabsContent>
        <TabsContent value="historico"><ComingSoon label="Histórico de Saídas" /></TabsContent>
      </Tabs>
    </div>
  );
}