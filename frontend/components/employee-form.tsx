'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Employee, EmployeeInput, CnhType } from '@/lib/api';

interface Props {
  initialData?: Employee;
  onSubmit: (data: EmployeeInput) => Promise<void>;
  onCancel: () => void;
}

const cnhOptions: CnhType[] = ['A', 'B', 'C', 'D', 'E'];

export function EmployeeForm({ initialData, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initialData?.name || '');
  const [role, setRole] = useState(initialData?.role || '');
  const [dailyRate, setDailyRate] = useState(initialData ? String(initialData.dailyRate) : '');
  const [cnhTypes, setCnhTypes] = useState<CnhType[]>(initialData?.cnhTypes || []);
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [active, setActive] = useState(initialData?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const estimatedHourly = (parseFloat(dailyRate) || 0) / 8;

  function toggleCnh(type: CnhType) {
    setCnhTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        name,
        role,
        dailyRate: parseFloat(dailyRate) || 0,
        cnhTypes,
        phone: phone || undefined,
        active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Função</Label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Soldador, Encarregado" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Taxa Diária (R$)</Label>
          <Input type="number" step="0.01" placeholder="0" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>CNH (selecione todas as categorias que possui)</Label>
        <div className="flex gap-3 flex-wrap">
          {cnhOptions.map((type) => (
            <label key={type} className="flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted">
              <input type="checkbox" checked={cnhTypes.includes(type)} onChange={() => toggleCnh(type)} />
              {type}
            </label>
          ))}
        </div>
        {cnhTypes.length === 0 && <p className="text-xs text-muted-foreground">Sem CNH</p>}
      </div>

      <p className="text-xs text-muted-foreground">Taxa/hora estimada (jornada de 8h): {estimatedHourly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <Label htmlFor="active">Funcionário ativo</Label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}