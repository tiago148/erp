'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Employee, Tool, ToolCharge } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Undo2 } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ToolChargePanel() {
  const { token } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [charges, setCharges] = useState<ToolCharge[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliverOpen, setDeliverOpen] = useState(false);

  // deliver form
  const [dToolId, setDToolId] = useState('');
  const [dEmployeeId, setDEmployeeId] = useState('');
  const [dCondition, setDCondition] = useState('Nova');
  const [dReason, setDReason] = useState('Primeira entrega');
  const [dNotes, setDNotes] = useState('');
  const [dError, setDError] = useState('');
  const [dSaving, setDSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [t, c, e] = await Promise.all([
        api.listTools(token),
        api.listToolCharges(token, { status: 'ACTIVE' }),
        api.listEmployees(token),
      ]);
      setTools(t); setCharges(c); setEmployees(e);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleDeliver() {
    if (!token) return;
    if (!dToolId || !dEmployeeId) { setDError('Selecione ferramenta e funcionário.'); return; }
    setDError(''); setDSaving(true);
    try {
      await api.chargeTool(token, dToolId, {
        employeeId: dEmployeeId, conditionOut: dCondition, reason: dReason, notes: dNotes || undefined,
      });
      setDeliverOpen(false);
      setDToolId(''); setDEmployeeId(''); setDNotes('');
      load();
    } catch (err) {
      setDError(err instanceof Error ? err.message : 'Erro ao registrar entrega');
    } finally { setDSaving(false); }
  }

  async function handleReturn(charge: ToolCharge) {
    if (!token) return;
    const reason = prompt('Motivo da devolução (ex: Devolução normal, Desligamento, Substituição):', 'Devolução normal');
    if (reason === null) return;
    await api.returnToolCharge(token, charge.id, { returnReason: reason });
    load();
  }

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  const activeByEmployee = new Map<string, ToolCharge[]>();
  for (const c of charges) {
    const list = activeByEmployee.get(c.employeeId) ?? [];
    list.push(c);
    activeByEmployee.set(c.employeeId, list);
  }
  const withCharge = employees.filter((e) => activeByEmployee.has(e.id)).length;
  const totalValue = charges.reduce((s, c) => {
    const t = tools.find((x) => x.id === c.toolId);
    return s + (t ? t.acquisitionValue : 0);
  }, 0);

  const availableIndividual = tools.filter(
    (t) => t.custody === 'INDIVIDUAL' && !charges.some((c) => c.toolId === t.id),
  );
  const otherTools = tools.filter((t) => t.custody !== 'INDIVIDUAL');

  return (
    <div className="space-y-4">
      <div className="rounded-md border-l-2 border-primary bg-muted/40 p-3 text-xs leading-relaxed">
        Ferramenta de uso individual e EPI não são consumo de obra — são <strong>carga pessoal</strong>. Ficam com o
        funcionário enquanto ele estiver na empresa, e voltam no desligamento. A ficha de carga assinada protege a empresa
        e quem cuida bem do que recebeu.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-md border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Itens em carga</p>
          <p className="text-2xl font-bold font-mono">{charges.length}</p>
          <p className="text-[10px] text-muted-foreground">com {withCharge} funcionário(s)</p>
        </div>
        <div className="rounded-md border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Valor em poder da equipe</p>
          <p className="text-lg font-bold font-mono text-primary">{fmt(totalValue)}</p>
        </div>
        <div className="rounded-md border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sem nenhuma carga</p>
          <p className={`text-2xl font-bold font-mono ${employees.length - withCharge ? 'text-warning' : 'text-success'}`}>{employees.length - withCharge}</p>
        </div>
        <div className="rounded-md border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Média por funcionário</p>
          <p className="text-lg font-bold font-mono">{fmt(withCharge ? totalValue / withCharge : 0)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setDeliverOpen(true)}><Plus size={16} className="mr-2" />Entregar Ferramenta</Button>
      </div>

      <div className="space-y-3">
        {employees.map((emp) => {
          const list = activeByEmployee.get(emp.id) ?? [];
          const val = list.reduce((s, c) => {
            const t = tools.find((x) => x.id === c.toolId);
            return s + (t ? t.acquisitionValue : 0);
          }, 0);
          return (
            <div key={emp.id} className="rounded-md border bg-card p-4">
              <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b">
                <div>
                  <p className="text-sm font-semibold">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-primary">{fmt(val)}</p>
                  <p className="text-[10px] text-muted-foreground">{list.length} ferramenta(s)</p>
                </div>
              </div>
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1">Nenhuma ferramenta individual em carga</p>
              ) : list.map((c) => {
                const t = tools.find((x) => x.id === c.toolId);
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 py-1.5 text-sm border-b last:border-0">
                    <span>🔧 {t ? `${t.code ? t.code + ' — ' : ''}${t.name}` : c.toolId}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">desde {new Date(c.chargedAt).toLocaleDateString('pt-BR')} · {c.conditionOut}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleReturn(c)}><Undo2 size={14} className="mr-1" />Devolver</Button>
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <Dialog open={deliverOpen} onOpenChange={setDeliverOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Entrega de Ferramenta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border-l-2 border-primary bg-muted/40 p-2.5 text-xs">
              Entrega de ferramenta de uso individual. Ela passa a ser carga do funcionário até a devolução ou o desligamento.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Funcionário</Label>
                <Select value={dEmployeeId} onValueChange={(v) => setDEmployeeId(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado na entrega</Label>
                <Select value={dCondition} onValueChange={(v) => setDCondition(v ?? 'Nova')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nova">Nova</SelectItem>
                    <SelectItem value="Usada — bom estado">Usada — bom estado</SelectItem>
                    <SelectItem value="Usada — com desgaste">Usada — com desgaste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ferramenta</Label>
              <Select value={dToolId} onValueChange={(v) => setDToolId(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {availableIndividual.length > 0 && (
                    <>
                      {availableIndividual.map((t) => <SelectItem key={t.id} value={t.id}>{t.code ? `${t.code} — ` : ''}{t.name} (individual)</SelectItem>)}
                    </>
                  )}
                  {otherTools.map((t) => <SelectItem key={t.id} value={t.id}>{t.code ? `${t.code} — ` : ''}{t.name} — converter p/ individual</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={dReason} onValueChange={(v) => setDReason(v ?? 'Primeira entrega')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primeira entrega">Primeira entrega</SelectItem>
                    <SelectItem value="Substituição por desgaste">Substituição por desgaste</SelectItem>
                    <SelectItem value="Substituição por dano">Substituição por dano</SelectItem>
                    <SelectItem value="Perda">Perda</SelectItem>
                    <SelectItem value="Troca de função">Troca de função</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input value={dNotes} onChange={(e) => setDNotes(e.target.value)} />
              </div>
            </div>
            {dError && <p className="text-sm text-destructive">{dError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDeliverOpen(false)}>Cancelar</Button>
              <Button type="button" disabled={dSaving} onClick={handleDeliver}>{dSaving ? 'Registrando...' : 'Registrar Entrega'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
