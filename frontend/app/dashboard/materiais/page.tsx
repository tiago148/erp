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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaterialForm } from '@/components/material-form';
import { Plus, Pencil, Trash2, Percent } from 'lucide-react';

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
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState('');

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

  const categories = Array.from(new Set(materials.map((m) => m.category))).sort();

  async function handleBulkAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const percentage = parseFloat(bulkPercentage);
    if (!percentage) { setBulkError('Informe um percentual diferente de zero.'); return; }
    setBulkError('');
    setBulkSaving(true);
    try {
      const result = await api.bulkAdjustMaterialPrices(token, { percentage, category: bulkCategory || undefined });
      alert(`${result.adjusted} material(is) reajustado(s).`);
      setIsBulkOpen(false);
      setBulkPercentage('');
      setBulkCategory('');
      loadMaterials(search);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Erro ao reajustar preços');
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Materiais</h1>
          <p className="text-muted-foreground">Base de preços de materiais e insumos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
            <Percent size={16} className="mr-2" />
            Reajustar Preços em Lote
          </Button>
          <Button onClick={openCreateForm}>
            <Plus size={16} className="mr-2" />
            Novo Material
          </Button>
        </div>
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

      <div className="border rounded-md bg-card">
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
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
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

      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reajustar Preços em Lote</DialogTitle></DialogHeader>
          <form onSubmit={handleBulkAdjust} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aplica um percentual de aumento (ou redução, com valor negativo) sobre o custo unitário. Orçamentos e projetos já fechados não são afetados.
            </p>
            <div className="space-y-2">
              <Label>Categoria (opcional — deixe em branco para todos)</Label>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Todas as categorias">{bulkCategory}</SelectValue></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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