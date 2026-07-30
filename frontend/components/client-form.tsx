'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Client, ClientInput } from '@/lib/api';

interface ClientFormProps {
  initialData?: Client;
  onSubmit: (data: ClientInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: ClientInput = {
  type: 'INDIVIDUAL',
  name: '',
  document: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  notes: '',
};

export function ClientForm({ initialData, onSubmit, onCancel }: ClientFormProps) {
  const [form, setForm] = useState<ClientInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        type: initialData.type,
        name: initialData.name,
        document: initialData.document,
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zipCode: initialData.zipCode || '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  function updateField<K extends keyof ClientInput>(field: K, value: ClientInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cliente');
    } finally {
      setIsSubmitting(false);
    }
  }

  const documentLabel = form.type === 'INDIVIDUAL' ? 'CPF' : 'CNPJ';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={form.type}
            onValueChange={(value) => updateField('type', value as ClientInput['type'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INDIVIDUAL">Pessoa Física</SelectItem>
              <SelectItem value="COMPANY">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{documentLabel}</Label>
          <Input
            value={form.document}
            onChange={(e) => updateField('document', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Nome / Razão Social</Label>
        <Input
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Endereço</Label>
        <Input
          value={form.address}
          onChange={(e) => updateField('address', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <Input
            value={form.state}
            onChange={(e) => updateField('state', e.target.value)}
            maxLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label>CEP</Label>
          <Input
            value={form.zipCode}
            onChange={(e) => updateField('zipCode', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

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