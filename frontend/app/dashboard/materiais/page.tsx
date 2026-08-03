'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Material, MaterialInput } from '@/lib/api';
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
import { MaterialForm } from '@/components/material-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MateriaisPage() {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>();

  const loadMaterials = useCallback(
    async (searchTerm?: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await api.listMaterials(token, searchTerm);
        setMaterials(data);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadMaterials(search);
  }

  function openCreateForm() {
    setEditingMaterial(undefined);
    setIsFormOpen(true);
  }

  function openEditForm(material: Material) {
    setEditingMaterial(material);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(data: MaterialInput) {
    if (!token) return;

    if (editingMaterial) {
      await api.updateMaterial(token, editingMaterial.id, data);
    } else {
      await api.createMaterial(token, data);
    }

    setIsFormOpen(false);
    loadMaterials(search);
  }

  async function handleDelete(material: Material) {
    if (!token) return;
    if (!confirm(`Excluir o material "${material.name}"?`)) return;

    await api.deleteMaterial(token, material.id);
    loadMaterials(search);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Materiais</h1>
          <p className="text-gray-500">Base de preços de materiais e insumos.</p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus size={16} className="mr-2" />
          Novo Material
        </Button>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm">
        <Input
          placeholder="Buscar por nome, código ou categoria..."
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
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Custo Unit.</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  Nenhum material cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>{material.code || '-'}</TableCell>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{material.category}</TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell>{formatCurrency(material.unitCost)}</TableCell>
                  <TableCell>{material.supplier || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(material)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(material)}
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
              {editingMaterial ? 'Editar Material' : 'Novo Material'}
            </DialogTitle>
          </DialogHeader>
          <MaterialForm
            initialData={editingMaterial}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}