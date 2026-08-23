'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, Material, MaterialInput, Supplier } from '@/lib/api';

interface MaterialFormProps {
  initialData?: Material;
  onSubmit: (data: MaterialInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: MaterialInput = {
  code: '',
  name: '',
  category: '',
  unit: '',
  unitCost: 0,
  supplier: '',
  referenceMode: 'MANUAL',
};

const referenceModeLabels: Record<string, string> = {
  MANUAL: 'Manual (usa o custo unitário abaixo)',
  AUTO: 'Automático (usa a cotação de menor custo posto)',
};

export function MaterialForm({ initialData, onSubmit, onCancel }: MaterialFormProps) {
  const { token } = useAuth();
  const [form, setForm] = useState<MaterialInput>(emptyForm);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.listSuppliers(token).then(setSuppliers);
  }, [token]);

  useEffect(() => {
    if (initialData) {
      setForm({
        code: initialData.code || '',
        name: initialData.name,
        category: initialData.category,
        unit: initialData.unit,
        unitCost: initialData.unitCost,
        supplier: initialData.supplier || '',
        referenceMode: initialData.referenceMode,
        manualQuoteId: initialData.manualQuoteId,
      });
    }
  }, [initialData]);

  function updateField<K extends keyof MaterialInput>(field: K, value: MaterialInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar material');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Código</Label>
          <Input
            value={form.code}
            onChange={(e) => updateField('code', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Nome do Material</Label>
        <Input
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Unidade (ex: m2, kg, un)</Label>
          <Input
            value={form.unit}
            onChange={(e) => updateField('unit', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Custo Unitário (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.unitCost}
            onChange={(e) => updateField('unitCost', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fornecedor</Label>
        <Select value={form.supplier || ''} onValueChange={(v) => updateField('supplier', v ?? undefined)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione (opcional)...">{form.supplier}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {suppliers.length === 0 && (
          <p className="text-xs text-warning">Nenhum fornecedor cadastrado ainda — cadastre em &quot;Compras &gt; Fornecedores&quot; primeiro.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Preço de Referência</Label>
        <Select value={form.referenceMode} onValueChange={(v) => updateField('referenceMode', v as any)}>
          <SelectTrigger>
            <SelectValue>{referenceModeLabels[form.referenceMode]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MANUAL">{referenceModeLabels.MANUAL}</SelectItem>
            <SelectItem value="AUTO">{referenceModeLabels.AUTO}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Controla o preço usado em orçamentos e composições. Gerencie as cotações no botão &quot;Cotações&quot; da listagem.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}