'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Project, ProjectInput, ProjectStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectForm } from '@/components/project-form';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em Andamento',
  ON_HOLD: 'Pausado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<ProjectStatus, string> = {
  PLANNING: 'bg-secondary text-secondary-foreground',
  IN_PROGRESS: 'bg-info/15 text-info',
  ON_HOLD: 'bg-warning/15 text-warning',
  COMPLETED: 'bg-success/15 text-success',
  CANCELLED: 'bg-destructive/15 text-destructive',
};

export default function ProjetosPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>();

  const load = useCallback(async (searchTerm?: string) => {
    if (!token) return;
    setLoading(true);
    try { setProjects(await api.listProjects(token, searchTerm)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: ProjectInput) {
    if (!token) return;
    if (editing) await api.updateProject(token, editing.id, data);
    else await api.createProject(token, data);
    setOpen(false);
    load(search);
  }

  async function handleDelete(p: Project) {
    if (!token || !confirm(`Excluir o projeto "${p.name}"?`)) return;
    await api.deleteProject(token, p.id);
    load(search);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">Obras em andamento e planejadas.</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus size={16} className="mr-2" />Novo Projeto
        </Button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="flex gap-2 max-w-sm">
        <Input placeholder="Buscar por número, nome ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="outline">Buscar</Button>
      </form>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead><TableHead>Nome</TableHead><TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead><TableHead>Valor Orçado</TableHead><TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : projects.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum projeto cadastrado.</TableCell></TableRow>
            ) : projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.number}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.client.name}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}`}>{statusLabels[p.status]}</span></TableCell>
                <TableCell className="font-semibold">{fmt(p.budgetAmount)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/projetos/${p.id}`}>
                      <Button variant="ghost" size="icon" title="Etapas e Curva S"><TrendingUp size={16} /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle></DialogHeader>
          <ProjectForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}