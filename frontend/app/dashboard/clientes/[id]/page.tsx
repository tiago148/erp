'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, Client, ClientContact, ClientContactInput, Project, Budget, FinanceEntry, ProjectStatus, BudgetStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientContactForm } from '@/components/client-contact-form';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';

const typeLabels: Record<string, string> = { INDIVIDUAL: 'Pessoa Física', COMPANY: 'Pessoa Jurídica' };

const projectStatusLabels: Record<ProjectStatus, string> = {
  PLANNING: 'Planejamento', IN_PROGRESS: 'Em Andamento', ON_HOLD: 'Pausado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
};

const budgetStatusLabels: Record<BudgetStatus, string> = {
  DRAFT: 'Rascunho', SENT: 'Enviado', APPROVED: 'Aprovado', REJECTED: 'Recusado', NEGOTIATING: 'Em Negociação',
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('pt-BR');
}

export default function ClienteDetailPage() {
  const { token } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientContact | undefined>();

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const [c, contactsData, allProjects, allBudgets, allFinance] = await Promise.all([
        api.getClient(token, id),
        api.listClientContacts(token, id),
        api.listProjects(token),
        api.listBudgets(token),
        api.listFinanceEntries(token),
      ]);
      setClient(c);
      setContacts(contactsData);
      setProjects(allProjects.filter((p) => p.clientId === id));
      setBudgets(allBudgets.filter((b) => b.clientId === id));
      setFinanceEntries(allFinance.filter((f) => f.clientId === id));
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: ClientContactInput) {
    if (!token) return;
    await api.createClientContact(token, data);
    setOpen(false);
    load();
  }

  async function handleUpdate(data: ClientContactInput) {
    if (!token || !editing) return;
    await api.updateClientContact(token, editing.id, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleDelete(contact: ClientContact) {
    if (!token || !confirm(`Excluir o contato "${contact.name}"?`)) return;
    await api.deleteClientContact(token, contact.id);
    load();
  }

  if (loading || !client) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  const approvedBudgets = budgets.filter((b) => b.status === 'APPROVED');
  const approvedValue = approvedBudgets.reduce((s, b) => s + b.totals.total, 0);
  const activeProjects = projects.filter((p) => p.status === 'PLANNING' || p.status === 'IN_PROGRESS');
  const revenueReceived = financeEntries
    .filter((f) => f.type === 'INCOME' && f.status === 'PAID')
    .reduce((s, f) => s + (f.paidAmount ?? f.amount), 0);
  const pendingReceivable = financeEntries
    .filter((f) => f.type === 'INCOME' && f.status === 'PENDING')
    .reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/clientes')}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">{typeLabels[client.type]} · {client.document}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Indicadores</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Orçamentos</p>
              <p className="font-mono text-lg font-semibold mt-1">{budgets.length}</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Aprovados</p>
              <p className="font-mono text-lg font-semibold text-success mt-1">{approvedBudgets.length}</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Valor Aprovado</p>
              <p className="font-mono text-lg font-semibold text-primary mt-1">{fmt(approvedValue)}</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Obras Ativas</p>
              <p className="font-mono text-lg font-semibold mt-1">{activeProjects.length} / {projects.length}</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Recebido</p>
              <p className="font-mono text-lg font-semibold text-success mt-1">{fmt(revenueReceived)}</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">A Receber</p>
              <p className="font-mono text-lg font-semibold text-warning mt-1">{fmt(pendingReceivable)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Orçamentos</CardTitle></CardHeader>
          <CardContent>
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum orçamento para este cliente.</p>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Número</TableHead><TableHead>Status</TableHead><TableHead>Valor</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((b) => (
                      <TableRow key={b.id} className="cursor-pointer hover:bg-muted" onClick={() => router.push(`/dashboard/orcamentos/${b.id}`)}>
                        <TableCell className="font-medium">{b.number}</TableCell>
                        <TableCell>{budgetStatusLabels[b.status]}</TableCell>
                        <TableCell className="font-mono">{fmt(b.totals.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Obras</CardTitle></CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma obra para este cliente.</p>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Número</TableHead><TableHead>Nome</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((p) => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted" onClick={() => router.push(`/dashboard/projetos/${p.id}`)}>
                        <TableCell className="font-medium">{p.number}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{projectStatusLabels[p.status]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Contatos</CardTitle>
          <Button size="sm" onClick={() => { setEditing(undefined); setOpen(true); }}>
            <Plus size={16} className="mr-2" />Novo Contato
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead><TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum contato cadastrado.</TableCell></TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.role || '-'}</TableCell>
                      <TableCell>{contact.phone || '-'}</TableCell>
                      <TableCell>{contact.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(contact); setOpen(true); }}><Pencil size={16} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(contact)}><Trash2 size={16} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Cliente desde {fmtDate(client.createdAt)}</p>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Contato' : 'Novo Contato'}</DialogTitle></DialogHeader>
          <ClientContactForm
            clientId={id}
            initialData={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setOpen(false); setEditing(undefined); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
