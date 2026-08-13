'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Project, StockItem, StockMovementInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  item: StockItem;
  onSubmit: (data: StockMovementInput) => Promise<void>;
  onCancel: () => void;
}

export function StockMovementForm({ item, onSubmit, onCancel }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token) api.listProjects(token).then(setProjects); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        type,
        quantity: parseFloat(quantity) || 0,
        projectId: type === 'OUT' ? projectId || undefined : undefined,
        notes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar movimentação');
    } finally {
      setSaving(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Estoque atual de <span className="font-medium">{item.material.name}</span>: {item.quantity} {item.material.unit}
      </p>

      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v) => setType(v as 'IN' | 'OUT')}>
          <SelectTrigger><SelectValue>{type === 'IN' ? 'Entrada' : 'Saída'}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">Entrada</SelectItem>
            <SelectItem value="OUT">Saída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Quantidade ({item.material.unit})</Label>
        <Input type="number" step="0.01" min="0.01" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>

      {type === 'OUT' && (
        <div className="space-y-2">
          <Label>Projeto de Destino (opcional)</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger><SelectValue placeholder="Selecione...">{selectedProject?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} - {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Registrando...' : 'Confirmar'}</Button>
      </div>
    </form>
  );
}