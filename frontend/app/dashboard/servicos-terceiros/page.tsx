'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, ThirdPartyService, ThirdPartyServiceInput } from '@/lib/api';
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
import { ThirdPartyServiceForm } from '@/components/third-party-service-form';
import { Plus, Pencil, Trash2, Percent } from 'lucide-react';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ServicosTerceirosPage() {
  const { token } = useAuth();
  const [services, setServices] = useState<ThirdPartyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ThirdPartyService | undefined>();
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const loadServices = useCallback(
    async (searchTerm?: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await api.listThirdPartyServices(token, searchTerm);
        setServices(data);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadServices(search);
  }

  function openCreateForm() {
    setEditingService(undefined);
    setIsFormOpen(true);
  }

  function openEditForm(service: ThirdPartyService) {
    setEditingService(service);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(data: ThirdPartyServiceInput) {
    if (!token) return;

    if (editingService) {
      await api.updateThirdPartyService(token, editingService.id, data);
    } else {
      await api.createThirdPartyService(token, data);
    }

    setIsFormOpen(false);
    loadServices(search);
  }

  async function handleDelete(service: ThirdPartyService) {
    if (!token) return;
    if (!confirm(`Excluir o serviço "${service.name}"?`)) return;

    await api.deleteThirdPartyService(token, service.id);
    loadServices(search);
  }

  const categories = Array.from(new Set(services.map((s) => s.category))).sort();

  async function handleBulkAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const percentage = parseFloat(bulkPercentage);
    if (!percentage) { setBulkError('Informe um percentual diferente de zero.'); return; }
    setBulkError('');
    setBulkSaving(true);
    try {
      const result = await api.bulkAdjustThirdPartyServicePrices(token, { percentage, category: bulkCategory || undefined });
      alert(`${result.adjusted} serviço(s) reajustado(s).`);
      setIsBulkOpen(false);
      setBulkPercentage('');
      setBulkCategory('');
      loadServices(search);
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
          <h1 className="text-2xl font-bold">Serviços de Terceiros</h1>
          <p className="text-muted-foreground">Base de preços de serviços terceirizados.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
            <Percent size={16} className="mr-2" />
            Reajustar Preços em Lote
          </Button>
          <Button onClick={openCreateForm}>
            <Plus size={16} className="mr-2" />
            Novo Serviço
          </Button>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm">
        <Input
          placeholder="Buscar por nome ou categoria..."
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
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Preço Unit.</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Prazo</TableHead>
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
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum serviço cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell>{service.unit}</TableCell>
                  <TableCell>{formatCurrency(service.unitPrice)}</TableCell>
                  <TableCell>{service.supplier || '-'}</TableCell>
                  <TableCell>{service.leadTimeDays ? `${service.leadTimeDays} dia(s)` : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(service)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(service)}
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
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>
          <ThirdPartyServiceForm
            initialData={editingService}
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
              Aplica um percentual de aumento (ou redução, com valor negativo) sobre o preço unitário. Orçamentos já fechados não são afetados.
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
