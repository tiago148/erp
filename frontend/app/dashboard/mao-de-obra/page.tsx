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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LaborRoleForm } from '@/components/labor-role-form';
import { SocialChargesTab } from '@/components/social-charges-tab';
import { Plus, Pencil, Trash2, Percent } from 'lucide-react';

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
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState('');

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

  async function handleBulkAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const percentage = parseFloat(bulkPercentage);
    if (!percentage) { setBulkError('Informe um percentual diferente de zero.'); return; }
    setBulkError('');
    setBulkSaving(true);
    try {
      const result = await api.bulkAdjustLaborRolePrices(token, { percentage });
      alert(`${result.adjusted} função(ões) reajustada(s).`);
      setIsBulkOpen(false);
      setBulkPercentage('');
      loadRoles(search);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Erro ao reajustar preços');
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mão de Obra</h1>
        <p className="text-muted-foreground">Funções, encargos e custos de mão de obra.</p>
      </div>

      <Tabs defaultValue="funcoes">
        <TabsList>
          <TabsTrigger value="funcoes">Funções</TabsTrigger>
          <TabsTrigger value="encargos">Encargos Sociais</TabsTrigger>
        </TabsList>

        <TabsContent value="funcoes" className="space-y-4">
          <div className="flex items-center justify-between">
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
                <Percent size={16} className="mr-2" />
                Reajustar Preços em Lote
              </Button>
              <Button onClick={openCreateForm}>
                <Plus size={16} className="mr-2" />
                Nova Função
              </Button>
            </div>
          </div>

          <div className="border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Função</TableHead>
                  <TableHead>Taxa/Hora</TableHead>
                  <TableHead>Encargos</TableHead>
                  <TableHead>Benefício/Hora</TableHead>
                  <TableHead>Taxa c/ Encargos</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma função cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{formatCurrency(role.hourlyRate)}</TableCell>
                      <TableCell>{role.chargesPct}%</TableCell>
                      <TableCell>{formatCurrency(role.beneficioHora)}</TableCell>
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
        </TabsContent>

        <TabsContent value="encargos">
          <SocialChargesTab />
        </TabsContent>
      </Tabs>

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

      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reajustar Preços em Lote</DialogTitle></DialogHeader>
          <form onSubmit={handleBulkAdjust} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aplica um percentual de aumento (ou redução, com valor negativo) sobre a taxa/hora de todas as funções. Orçamentos e projetos já fechados não são afetados.
            </p>
            <div className="space-y-2">
              <Label>Percentual de Reajuste (%)</Label>
              <Input type="number" step="0.1" placeholder="Ex: 5 ou -3" value={bulkPercentage} onChange={(e) => setBulkPercentage(e.target.value)} required />
            </div>
            {bulkError && <p className="text-sm text-destructive">{bulkError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsBulkOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={bulkSaving}>{bulkSaving ? 'Aplicando...' : 'Aplicar Reajuste'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}