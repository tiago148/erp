'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Project, Employee, Vehicle, Tool, WorkLog, WorkLogInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

interface Props {
  initialData?: WorkLog;
  onSubmit: (data: WorkLogInput) => Promise<void>;
  onCancel: () => void;
}

export function WorkLogForm({ initialData, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  const [projectId, setProjectId] = useState(initialData?.projectId || '');
  const [date, setDate] = useState(initialData?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState(initialData?.weather || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [occurrences, setOccurrences] = useState(initialData?.occurrences || '');
  const [employeeIds, setEmployeeIds] = useState<string[]>(initialData?.employees.map((e) => e.employeeId) || []);
  const [vehicleEntries, setVehicleEntries] = useState<{ vehicleId: string; driverId: string }[]>(
    initialData?.vehicleUsages.map((v) => ({ vehicleId: v.vehicleId, driverId: v.driverId || '' })) || [],
  );
  const [toolIds, setToolIds] = useState<string[]>(initialData?.toolsUsed.map((t) => t.toolId) || []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listProjects(token).then(setProjects);
    api.listEmployees(token).then(setEmployees);
    api.listVehicles(token).then(setVehicles);
    api.listTools(token).then(setTools);
  }, [token]);

  function toggleEmployee(id: string) {
    setEmployeeIds((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  function toggleTool(id: string) {
    setToolIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function addVehicleEntry() {
    setVehicleEntries([...vehicleEntries, { vehicleId: '', driverId: '' }]);
  }

  function updateVehicleEntry(idx: number, field: 'vehicleId' | 'driverId', value: string) {
    const arr = [...vehicleEntries];
    arr[idx] = { ...arr[idx], [field]: value };
    setVehicleEntries(arr);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) { setError('Selecione um projeto.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        projectId,
        date,
        weather: weather || undefined,
        description,
        occurrences: occurrences || undefined,
        employeeIds,
        vehicles: vehicleEntries
          .filter((v) => v.vehicleId)
          .map((v) => ({ vehicleId: v.vehicleId, driverId: v.driverId || undefined })),
        toolIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Projeto</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione...">
              {selectedProject ? `${selectedProject.number} - ${selectedProject.name}` : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Clima</Label>
          <Input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="Ex: Ensolarado" />
        </div>
      </div>

      {/* FUNCIONÁRIOS */}
      <div className="space-y-2">
        <Label>Funcionários em Campo</Label>
        <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto border rounded-md p-2">
          {employees.length === 0 && <p className="text-xs text-gray-400">Nenhum funcionário cadastrado.</p>}
          {employees.map((e) => (
            <label key={e.id} className="flex items-center gap-1.5 text-sm border rounded-md px-2 py-1 cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={employeeIds.includes(e.id)} onChange={() => toggleEmployee(e.id)} />
              {e.name}
            </label>
          ))}
        </div>
      </div>

      {/* VEÍCULOS + MOTORISTA */}
      <div className="border rounded-md p-4 space-y-3 bg-white">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Veículos Utilizados</Label>
          <Button type="button" size="sm" variant="outline" onClick={addVehicleEntry}>
            <Plus size={14} className="mr-1" />Adicionar
          </Button>
        </div>
        {vehicleEntries.length === 0 && <p className="text-sm text-gray-400">Nenhum veículo adicionado.</p>}
        {vehicleEntries.map((entry, idx) => {
          const vehicle = vehicles.find((v) => v.id === entry.vehicleId);
          const driver = employees.find((e) => e.id === entry.driverId);
          return (
            <div key={idx} className="flex gap-2 items-center flex-wrap">
              <Select value={entry.vehicleId} onValueChange={(v) => updateVehicleEntry(idx, 'vehicleId', v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Veículo">{vehicle?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={entry.driverId} onValueChange={(v) => updateVehicleEntry(idx, 'driverId', v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Motorista (opcional)">{driver?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" size="icon" variant="ghost" onClick={() => setVehicleEntries(vehicleEntries.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
      </div>

      {/* FERRAMENTAS */}
      <div className="space-y-2">
        <Label>Ferramentas Levadas</Label>
        <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto border rounded-md p-2">
          {tools.length === 0 && <p className="text-xs text-gray-400">Nenhuma ferramenta cadastrada.</p>}
          {tools.map((t) => (
            <label key={t.id} className="flex items-center gap-1.5 text-sm border rounded-md px-2 py-1 cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={toolIds.includes(t.id)} onChange={() => toggleTool(t.id)} />
              {t.name}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição das Atividades</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
      </div>

      <div className="space-y-2">
        <Label>Ocorrências (opcional)</Label>
        <Textarea value={occurrences} onChange={(e) => setOccurrences(e.target.value)} rows={2} placeholder="Atrasos, imprevistos, acidentes..." />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}