'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, LaborRole, LaborRoleInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LaborRoleForm } from '@/components/labor-role-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MaoDeObraPage() {
  const { token } = useAuth();
  const [roles, setRoles] = useState<LaborRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<LaborRole | undefined>();

  const loadRoles = useCallback(
    async (searchTerm?: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await api.listLaborRoles(token, searchTerm);
        setRoles(data);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadRoles(search);
  }

  function openCreateForm() {
    setEditingRole(undefined);
    setIsFormOpen(true);
  }

  function openEditForm(role: LaborRole) {
    setEditingRole(role);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(data: LaborRoleInput) {
    if (!token) return;

    if (editingRole) {
      await api.updateLaborRole(token, editingRole.id, data);
    } else {
      await api.createLaborRole(token, data);
    }

    setIsFormOpen(false);
    loadRoles(search);
  }

  async function handleDelete(role: LaborRole) {
    if (!token) return;
    if (!confirm(`Excluir a função "${role.name}"?`)) return;

    await api.deleteLaborRole(token, role.id);
    loadRoles(search);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mão de Obra</h1>
          <p className="text-gray-500">Funções e custos de mão de obra.</p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus size={16} className="mr-2" />
          Nova Função
        </Button>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm">
        <Input
          placeholder="Buscar por função..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Função</TableHead>
              <TableHead>Taxa/Hora</TableHead>
              <TableHead>Encargos</TableHead>
              <TableHead>Taxa c/ Encargos</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  Nenhuma função cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{formatCurrency(role.hourlyRate)}</TableCell>
                  <TableCell>{role.chargesPct}%</TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(role.effectiveHourlyRate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(role)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(role)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Função' : 'Nova Função'}
            </DialogTitle>
          </DialogHeader>
          <LaborRoleForm
            initialData={editingRole}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}