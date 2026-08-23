'use client';

import { useState } from 'react';
import { Playbook, PlaybookInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  initialData?: Playbook;
  onSubmit: (data: PlaybookInput) => Promise<void>;
  onCancel: () => void;
}

export const playbookCategoryLabels: Record<string, string> = {
  fabricacao: 'Fabricação', soldagem: 'Soldagem', acabamento: 'Acabamento',
  montagem: 'Montagem em campo', qualidade: 'Qualidade e inspeção',
  maquina: 'Instrução de máquina', admin: 'Administrativo', seguranca: 'Segurança',
};

export function PlaybookForm({ initialData, onSubmit, onCancel }: Props) {
  const [code, setCode] = useState(initialData?.code || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || 'fabricacao');
  const [objective, setObjective] = useState(initialData?.objective || '');
  const [executor, setExecutor] = useState(initialData?.executor || '');
  const [requirements, setRequirements] = useState(initialData?.requirements || '');
  const [steps, setSteps] = useState<string[]>(initialData?.steps?.length ? initialData.steps : ['']);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(initialData?.acceptanceCriteria || '');
  const [commonErrors, setCommonErrors] = useState(initialData?.commonErrors || '');
  const [standardTime, setStandardTime] = useState(initialData?.standardTime || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (!title.trim()) { setError('Informe o título.'); return; }
    if (cleanSteps.length === 0) { setError('Adicione ao menos um passo.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        code: code || undefined,
        title,
        category,
        objective: objective || undefined,
        executor: executor || undefined,
        requirements: requirements || undefined,
        steps: cleanSteps,
        acceptanceCriteria: acceptanceCriteria || undefined,
        commonErrors: commonErrors || undefined,
        standardTime: standardTime || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar procedimento');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Código</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="POP-001" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Soldagem TIG de tubulação inox" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={category} onValueChange={(v) => setCategory(v || 'fabricacao')}>
          <SelectTrigger className="w-full"><SelectValue>{playbookCategoryLabels[category]}</SelectValue></SelectTrigger>
          <SelectContent>
            {Object.entries(playbookCategoryLabels).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Objetivo</Label>
          <Input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="O que este procedimento garante" />
        </div>
        <div className="space-y-2">
          <Label>Quem executa</Label>
          <Input value={executor} onChange={(e) => setExecutor(e.target.value)} placeholder="Ex: Soldador TIG qualificado" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Materiais, ferramentas e EPIs necessários</Label>
        <Input value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Separados por vírgula" />
      </div>

      <div className="border rounded-md p-3 space-y-2">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">Passos</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => setSteps([...steps, ''])}>
            <Plus size={14} className="mr-1" />Passo
          </Button>
        </div>
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <span className="w-6 text-center text-xs text-muted-foreground shrink-0">{idx + 1}</span>
            <Input value={step} placeholder="Descreva o passo" onChange={(e) => {
              const arr = [...steps]; arr[idx] = e.target.value; setSteps(arr);
            }} />
            <Button type="button" size="icon" variant="ghost" onClick={() => setSteps(steps.filter((_, i) => i !== idx))}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Critério de aceitação</Label>
          <Textarea value={acceptanceCriteria} onChange={(e) => setAcceptanceCriteria(e.target.value)} placeholder="Como saber que ficou certo" />
        </div>
        <div className="space-y-2">
          <Label>Erros comuns / o que nunca fazer</Label>
          <Textarea value={commonErrors} onChange={(e) => setCommonErrors(e.target.value)} placeholder="O que costuma dar errado" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tempo padrão de referência</Label>
        <Input value={standardTime} onChange={(e) => setStandardTime(e.target.value)} placeholder="Ex: 45 min por junta" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
