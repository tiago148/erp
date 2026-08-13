'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, EppDelivery, EppInput, DdsRecord, DdsInput, Training, TrainingInput, Employee } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EppForm } from '@/components/epp-form';
import { DdsForm } from '@/components/dds-form';
import { TrainingForm } from '@/components/training-form';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function isExpiringSoon(expiresAt?: string) {
  if (!expiresAt) return false;
  const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

function EppTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<EppDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listEpp(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: EppInput) {
    if (!token) return;
    await api.createEpp(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(item: EppDelivery) {
    if (!token || !confirm('Excluir este registro?')) return;
    await api.deleteEpp(token, item.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Nova Entrega</Button>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Funcionário</TableHead><TableHead>Item</TableHead><TableHead>Data</TableHead><TableHead>Assinado</TableHead><TableHead className="w-16">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma entrega registrada.</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.employee.name}</TableCell>
                <TableCell>{item.itemName}</TableCell>
                <TableCell>{formatDate(item.deliveredAt)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.signed ? 'bg-success/15 text-success' : 'bg-secondary text-secondary-foreground'}`}>
                    {item.signed ? 'Sim' : 'Pendente'}
                  </span>
                </TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(item)}><Trash2 size={16} /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nova Entrega de EPI</DialogTitle></DialogHeader>
          <EppForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DdsTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<DdsRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [dds, emp] = await Promise.all([api.listDds(token), api.listEmployees(token)]);
      setItems(dds);
      setEmployees(emp);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: DdsInput) {
    if (!token) return;
    await api.createDds(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(item: DdsRecord) {
    if (!token || !confirm('Excluir este registro?')) return;
    await api.deleteDds(token, item.id);
    load();
  }

  function participantNames(ids: string[]) {
    return ids.map((id) => employees.find((e) => e.id === id)?.name || '?').join(', ');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Novo DDS</Button>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Nenhum DDS registrado.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border rounded-md bg-card p-4 space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{item.topic}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(item.date)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}><Trash2 size={16} /></Button>
              </div>
              <p className="text-sm text-muted-foreground">Participantes: {item.participants.length > 0 ? participantNames(item.participants) : 'Nenhum registrado'}</p>
              {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo Registro de DDS</DialogTitle></DialogHeader>
          <DdsForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TrainingsTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listTrainings(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: TrainingInput) {
    if (!token) return;
    await api.createTraining(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(item: Training) {
    if (!token || !confirm('Excluir este treinamento?')) return;
    await api.deleteTraining(token, item.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Novo Treinamento</Button>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Funcionário</TableHead><TableHead>Norma</TableHead><TableHead>Conclusão</TableHead><TableHead>Validade</TableHead><TableHead className="w-16">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum treinamento registrado.</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.employee.name}</TableCell>
                <TableCell>{item.nrType}</TableCell>
                <TableCell>{formatDate(item.completedAt)}</TableCell>
                <TableCell>
                  {item.expiresAt ? (
                    <span className={`flex items-center gap-1 text-sm ${isExpired(item.expiresAt) ? 'text-destructive' : isExpiringSoon(item.expiresAt) ? 'text-warning' : 'text-muted-foreground'}`}>
                      {(isExpired(item.expiresAt) || isExpiringSoon(item.expiresAt)) && <AlertTriangle size={14} />}
                      {formatDate(item.expiresAt)}
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(item)}><Trash2 size={16} /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo Treinamento</DialogTitle></DialogHeader>
          <TrainingForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SegurancaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Segurança do Trabalho</h1>
        <p className="text-muted-foreground">EPI, DDS e treinamentos NR.</p>
      </div>
      <Tabs defaultValue="epi">
        <TabsList>
          <TabsTrigger value="epi">EPI</TabsTrigger>
          <TabsTrigger value="dds">DDS</TabsTrigger>
          <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>
        </TabsList>
        <TabsContent value="epi"><EppTab /></TabsContent>
        <TabsContent value="dds"><DdsTab /></TabsContent>
        <TabsContent value="treinamentos"><TrainingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}