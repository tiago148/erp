'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, ManagedUser, CreateUserByAdminInput, UserRole } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Send } from 'lucide-react';

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('pt-BR');
}

const roleLabels: Record<UserRole, string> = { ADMIN: 'Administrador', USER: 'Usuário' };

function NewUserForm({ onSubmit, onCancel }: { onSubmit: (data: CreateUserByAdminInput) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({ name, email, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Um e-mail de confirmação será enviado. O usuário define a própria senha ao confirmar a conta.
      </p>
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Perfil</Label>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger className="w-full"><SelectValue>{roleLabels[role]}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">Usuário</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Criando...' : 'Criar Usuário'}</Button>
      </div>
    </form>
  );
}

export default function UsuariosPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setUsers(await api.listUsers(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: CreateUserByAdminInput) {
    if (!token) return;
    await api.createUserByAdmin(token, data);
    setOpen(false);
    setMessage('Usuário criado. Um e-mail de confirmação foi enviado (ou, se o SMTP ainda não estiver configurado, o link apareceu no log do servidor).');
    load();
  }

  async function handleResend(u: ManagedUser) {
    if (!token) return;
    setMessage('');
    try {
      const result = await api.resendConfirmation(token, u.email);
      setMessage(result.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao reenviar confirmação');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Contas de acesso ao sistema.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Novo Usuário</Button>
        )}
      </div>

      {!isAdmin && (
        <p className="text-sm text-warning bg-warning/10 border border-warning/30 rounded-md p-3">
          Apenas administradores podem criar usuários ou reenviar confirmações. Você pode visualizar.
        </p>
      )}

      {message && <p className="text-sm text-info bg-info/10 border border-info/30 rounded-md p-3">{message}</p>}

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead><TableHead>Criado em</TableHead>
              {isAdmin && <TableHead className="w-24">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum usuário cadastrado.</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{roleLabels[u.role]}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.active ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                    {u.active ? 'Ativo' : 'Confirmação pendente'}
                  </span>
                </TableCell>
                <TableCell>{fmtDate(u.createdAt)}</TableCell>
                {isAdmin && (
                  <TableCell>
                    {!u.active && (
                      <Button variant="ghost" size="icon" title="Reenviar confirmação" onClick={() => handleResend(u)}>
                        <Send size={16} />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
          <NewUserForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
