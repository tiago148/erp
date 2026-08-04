'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Vehicle, VehicleInput } from '@/lib/api';
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
import { VehicleForm } from '@/components/vehicle-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function VeiculosPage() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();

  const loadVehicles = useCallback(
    async (searchTerm?: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await api.listVehicles(token, searchTerm);
        setVehicles(data);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadVehicles(search);
  }

  function openCreateForm() {
    setEditingVehicle(undefined);
    setIsFormOpen(true);
  }

  function openEditForm(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(data: VehicleInput) {
    if (!token) return;

    if (editingVehicle) {
      await api.updateVehicle(token, editingVehicle.id, data);
    } else {
      await api.createVehicle(token, data);
    }

    setIsFormOpen(false);
    loadVehicles(search);
  }

  async function handleDelete(vehicle: Vehicle) {
    if (!token) return;
    if (!confirm(`Excluir o veículo "${vehicle.name}"?`)) return;

    await api.deleteVehicle(token, vehicle.id);
    loadVehicles(search);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Veículos</h1>
          <p className="text-gray-500">Frota da empresa e consumo médio.</p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus size={16} className="mr-2" />
          Novo Veículo
        </Button>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm">
        <Input
          placeholder="Buscar por nome ou placa..."
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
              <TableHead>Nome</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Combustível</TableHead>
              <TableHead>Consumo (km/l)</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  Nenhum veículo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.name}</TableCell>
                  <TableCell>{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{vehicle.fuelType}</TableCell>
                  <TableCell>{vehicle.avgConsumption}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(vehicle)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(vehicle)}
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
              {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
            </DialogTitle>
          </DialogHeader>
          <VehicleForm
            initialData={editingVehicle}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}