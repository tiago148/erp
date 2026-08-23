'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Employee, EmployeeInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmployeeForm } from '@/components/employee-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FuncionariosPage() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>();

  const load = useCallback(async (searchTerm?: string) => {
    if (!token) return;
    setLoading(true);
    try { setEmployees(await api.listEmployees(token, searchTerm)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: EmployeeInput) {
    if (!token) return;
    if (editing) await api.updateEmployee(token, editing.id, data);
    else await api.createEmployee(token, data);
    setOpen(false);
    load(search);
  }

  async function handleDelete(e: Employee) {
    if (!token || !confirm(`Excluir "${e.name}"?`)) return;
    await api.deleteEmployee(token, e.id);
    load(search);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funcionários</h1>
          <p className="text-muted-foreground">Equipe da empresa.</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus size={16} className="mr-2" />Novo Funcionário
        </Button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="flex gap-2 max-w-sm">
        <Input placeholder="Buscar por nome ou função..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="outline">Buscar</Button>
      </form>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Função</TableHead><TableHead>Taxa Diária</TableHead>
              <TableHead>Taxa/h</TableHead><TableHead>CNH</TableHead><TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : employees.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum funcionário cadastrado.</TableCell></TableRow>
            ) : employees.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>{e.role}</TableCell>
                <TableCell>{fmt(e.dailyRate)}</TableCell>
                <TableCell>{fmt(e.hourlyRate)}</TableCell>
                <TableCell>
                  {e.cnhTypes.length === 0 ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">Sem CNH</span>
                  ) : (
                    <div className="flex gap-1">
                      {e.cnhTypes.map((type) => (
                        <span key={type} className="px-2 py-1 rounded-full text-xs font-medium bg-info/15 text-info">{type}</span>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${e.active ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                    {e.active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(e); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle></DialogHeader>
          <EmployeeForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}