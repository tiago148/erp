'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, FixedExpense, FixedExpenseInput, Asset, AssetInput, Settings, OverheadMethod, CostComposition, CostCompositionInput, Budget, FinanceEntry } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FixedExpenseForm } from '@/components/fixed-expense-form';
import { AssetForm } from '@/components/asset-form';
import { CostCompositionForm } from '@/components/cost-composition-form';
import { computeIndirectCost } from '@/lib/overhead';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function FixedExpensesTab() {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setExpenses(await api.listFixedExpenses(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: FixedExpenseInput) {
    if (!token) return;
    await api.createFixedExpense(token, data);
    setOpen(false);
    load();
  }

  async function handleUpdate(data: FixedExpenseInput) {
    if (!token || !editing) return;
    await api.updateFixedExpense(token, editing.id, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleDelete(expense: FixedExpense) {
    if (!token || !confirm(`Excluir a despesa fixa "${expense.description}"?`)) return;
    await api.deleteFixedExpense(token, expense.id);
    load();
  }

  const totalMonthly = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tudo que a empresa paga todo mês independente de ter obra: aluguel, contador, pró-labore, salários administrativos,
        softwares, seguros. É a base do cálculo da taxa administrativa que entra nos orçamentos.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Despesa Fixa Mensal</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-mono text-destructive">{fmt(totalMonthly)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Custo Anual da Estrutura</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-mono text-warning">{fmt(totalMonthly * 12)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Itens Cadastrados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{expenses.length}</p></CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Nova Despesa</Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Valor Mensal</TableHead><TableHead>Tipo</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : expenses.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma despesa fixa cadastrada.</TableCell></TableRow>
            ) : expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {expense.description}
                  {expense.generatesBill && <Badge variant="accent" className="ml-2">conta automática</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground">{expense.category}</TableCell>
                <TableCell className="font-mono text-destructive">{fmt(expense.amount)}</TableCell>
                <TableCell>{expense.type === 'FIXED' ? 'Fixo' : 'Semivariável'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(expense); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(expense)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}</DialogTitle></DialogHeader>
          <FixedExpenseForm
            initialData={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setOpen(false); setEditing(undefined); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssetsTab() {
  const { token } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setAssets(await api.listAssets(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: AssetInput) {
    if (!token) return;
    await api.createAsset(token, data);
    setOpen(false);
    load();
  }

  async function handleUpdate(data: AssetInput) {
    if (!token || !editing) return;
    await api.updateAsset(token, editing.id, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleDelete(asset: Asset) {
    if (!token || !confirm(`Excluir o patrimônio "${asset.name}"?`)) return;
    await api.deleteAsset(token, asset.id);
    load();
  }

  const totalMonthlyCost = assets.reduce((s, a) => s + a.totalMonthlyCost, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Veículos, ferramentas e equipamentos também custam dinheiro parados: perdem valor (depreciação) e imobilizam capital
        que poderia render em outro lugar (custo de oportunidade). Esse custo mensal entra no mesmo pool da taxa administrativa.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Custo Mensal do Patrimônio</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-mono text-destructive">{fmt(totalMonthlyCost)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Valor Contábil Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-mono">{fmt(assets.reduce((s, a) => s + a.bookValue, 0))}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Bens Cadastrados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{assets.length}</p></CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Novo Patrimônio</Button>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bem</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Valor Contábil</TableHead><TableHead>Depreciação/mês</TableHead>
              <TableHead>Custo Oport./mês</TableHead><TableHead>Custo Total/mês</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : assets.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum patrimônio cadastrado.</TableCell></TableRow>
            ) : assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">
                  {asset.name}
                  {asset.isFullyDepreciated && <Badge variant="outline" className="ml-2">totalmente depreciado</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground">{asset.category || '-'}</TableCell>
                <TableCell className="font-mono">{fmt(asset.bookValue)}</TableCell>
                <TableCell className="font-mono">{fmt(asset.depreciationContribution)}</TableCell>
                <TableCell className="font-mono">{fmt(asset.opportunityCostContribution)}</TableCell>
                <TableCell className="font-mono font-semibold text-destructive">{fmt(asset.totalMonthlyCost)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(asset); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(asset)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Patrimônio' : 'Novo Patrimônio'}</DialogTitle></DialogHeader>
          <AssetForm
            initialData={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setOpen(false); setEditing(undefined); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const methodInfo: Record<OverheadMethod, { label: string; description: string }> = {
  DAY: { label: 'R$ por dia de projeto', description: 'Divide a despesa fixa pelos dias úteis produtivos do mês. Cada dia de obra carrega a mesma parcela de estrutura.' },
  HOUR: { label: 'R$ por hora produtiva', description: 'Divide a despesa fixa pelas horas de mão de obra vendáveis no mês.' },
  PERCENT: { label: '% sobre o custo direto', description: 'Aplica um percentual sobre o custo direto médio da empresa.' },
};

function OverheadTab() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fixedTotal, setFixedTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [method, setMethod] = useState<OverheadMethod>('DAY');
  const [funcCount, setFuncCount] = useState(5);
  const [hoursPerMonth, setHoursPerMonth] = useState(176);
  const [occupancyPct, setOccupancyPct] = useState(72);
  const [workDaysPerMonth, setWorkDaysPerMonth] = useState(22);
  const [avgDirectCost, setAvgDirectCost] = useState(0);
  const [simultaneousProjects, setSimultaneousProjects] = useState(1);
  const [autoApply, setAutoApply] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([api.getSettings(token), api.listFixedExpenses(token), api.listAssets(token)]).then(([s, expenses, assets]) => {
      setSettings(s);
      setFixedTotal(
        expenses.reduce((sum, e) => sum + e.amount, 0) +
        assets.reduce((sum, a) => sum + a.totalMonthlyCost, 0),
      );
      setMethod(s.overheadMethod);
      setFuncCount(s.overheadFuncCount ?? 5);
      setHoursPerMonth(s.overheadHoursPerMonth ?? 176);
      setOccupancyPct(s.overheadOccupancyPct);
      setWorkDaysPerMonth(s.overheadWorkDaysPerMonth ?? 22);
      setAvgDirectCost(s.overheadAvgDirectCost ?? 0);
      setSimultaneousProjects(s.overheadSimultaneousProjects ?? 1);
      setAutoApply(s.overheadAutoApply);
    });
  }, [token]);

  const occupancy = occupancyPct / 100;
  const productiveDays = workDaysPerMonth * occupancy;
  const productiveHours = funcCount * hoursPerMonth * occupancy;
  const previewSettings = {
    overheadMethod: method,
    overheadFuncCount: funcCount,
    overheadHoursPerMonth: hoursPerMonth,
    overheadOccupancyPct: occupancyPct,
    overheadWorkDaysPerMonth: workDaysPerMonth,
    overheadAvgDirectCost: avgDirectCost,
    overheadSimultaneousProjects: simultaneousProjects,
    overheadAutoApply: true,
  };
  const ratePerDay = computeIndirectCost(previewSettings, fixedTotal, 0, 0, 1);
  const ratePerHour = computeIndirectCost(previewSettings, fixedTotal, 0, 1, 0);
  const ratePct = avgDirectCost > 0 ? (fixedTotal / avgDirectCost) * 100 : 0;

  const recoveredPerProject = ratePerDay * productiveDays;
  const recoveredTotal = recoveredPerProject * Math.max(1, simultaneousProjects);
  const recoveryDiff = recoveredTotal - fixedTotal;
  const recoveryOk = Math.abs(recoveryDiff) < 0.5;

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.updateSettings(token, {
        overheadMethod: method,
        overheadFuncCount: funcCount,
        overheadHoursPerMonth: hoursPerMonth,
        overheadOccupancyPct: occupancyPct,
        overheadWorkDaysPerMonth: workDaysPerMonth,
        overheadAvgDirectCost: avgDirectCost,
        overheadSimultaneousProjects: simultaneousProjects,
        overheadAutoApply: autoApply,
      });
      setSettings(updated);
      setMessage('Configuração de custos indiretos salva!');
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Método de Absorção</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.keys(methodInfo) as OverheadMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`text-left rounded-md border p-3 transition-colors ${
                    method === m ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80'
                  }`}
                >
                  <p className="text-sm font-semibold">{methodInfo[m].label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{methodInfo[m].description}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Funcionários produtivos</Label>
                <Input type="number" min={1} value={funcCount} onChange={(e) => setFuncCount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Dias úteis por mês</Label>
                <Input type="number" min={1} value={workDaysPerMonth} onChange={(e) => setWorkDaysPerMonth(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Horas úteis por mês</Label>
                <Input type="number" min={1} value={hoursPerMonth} onChange={(e) => setHoursPerMonth(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Fator de ocupação (%)</Label>
                <Input type="number" min={1} max={100} value={occupancyPct} onChange={(e) => setOccupancyPct(Number(e.target.value))} />
              </div>
            </div>
            {method === 'PERCENT' && (
              <div className="space-y-2">
                <Label>Custo direto médio mensal (R$)</Label>
                <Input type="number" min={0} step="0.01" value={avgDirectCost} onChange={(e) => setAvgDirectCost(Number(e.target.value))} />
              </div>
            )}
            {method === 'DAY' && (
              <div className="space-y-2">
                <Label>Obras simultâneas</Label>
                <Input type="number" min={1} value={simultaneousProjects} onChange={(e) => setSimultaneousProjects(Math.max(1, Number(e.target.value)))} />
                <p className="text-xs text-muted-foreground">Quantas obras a empresa costuma tocar ao mesmo tempo — o pool de custo fixo do dia é dividido entre elas, senão cada orçamento absorveria a despesa fixa inteira.</p>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
              <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} className="h-4 w-4 accent-primary" />
              Aplicar automaticamente em novos orçamentos
            </label>
            {message && <p className="text-sm text-success">{message}</p>}
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Configuração'}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resultado do Cálculo</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm py-1 border-b"><span className="text-muted-foreground">Despesa fixa mensal (inclui patrimônio)</span><span className="font-mono">{fmt(fixedTotal)}</span></div>
            {method === 'DAY' && (
              <>
                <div className="flex justify-between text-sm py-1 border-b"><span className="text-muted-foreground">Dias produtivos no mês</span><span className="font-mono">{productiveDays.toFixed(1)}</span></div>
                <div className="flex justify-between text-sm py-1 border-b"><span className="text-muted-foreground">Obras simultâneas</span><span className="font-mono">{Math.max(1, simultaneousProjects)}</span></div>
                <div className="flex justify-between items-center py-2"><span className="font-medium">Taxa por dia de projeto</span><span className="font-mono text-lg font-bold text-primary">{fmt(ratePerDay)}</span></div>

                <div className="rounded-md bg-muted p-3 mt-2 space-y-1 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teste de Recuperação</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Recuperado por obra no mês</span><span className="font-mono">{fmt(recoveredPerProject)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Recuperado total ({Math.max(1, simultaneousProjects)} obra(s) × dias produtivos)</span><span className="font-mono">{fmt(recoveredTotal)}</span></div>
                  <div className="flex justify-between font-medium border-t border-border pt-1 mt-1">
                    <span>{recoveryOk ? '✅ Pool de custo fixo totalmente recuperado' : '⚠️ Diferença em relação à despesa fixa'}</span>
                    <span className="font-mono">{fmt(recoveryDiff)}</span>
                  </div>
                </div>
              </>
            )}
            {method === 'HOUR' && (
              <>
                <div className="flex justify-between text-sm py-1 border-b"><span className="text-muted-foreground">Horas produtivas no mês</span><span className="font-mono">{productiveHours.toFixed(1)}</span></div>
                <div className="flex justify-between items-center py-2"><span className="font-medium">Taxa por hora produtiva</span><span className="font-mono text-lg font-bold text-primary">{fmt(ratePerHour)}</span></div>
              </>
            )}
            {method === 'PERCENT' && (
              <div className="flex justify-between items-center py-2"><span className="font-medium">Taxa sobre custo direto</span><span className="font-mono text-lg font-bold text-primary">{ratePct.toFixed(2)}%</span></div>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              {autoApply
                ? 'Com a aplicação automática ligada, todo orçamento novo ganha a linha "Custos Indiretos" antes do BDI.'
                : 'A aplicação automática está desligada — os orçamentos não recebem custo indireto até você ativar a opção ao lado.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CompositionsTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<CostComposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CostComposition | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setItems(await api.listCostCompositions(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: CostCompositionInput) {
    if (!token) return;
    await api.createCostComposition(token, data);
    setOpen(false);
    load();
  }

  async function handleUpdate(data: CostCompositionInput) {
    if (!token || !editing) return;
    await api.updateCostComposition(token, editing.id, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleDelete(item: CostComposition) {
    if (!token || !confirm(`Excluir a composição "${item.name}"?`)) return;
    try {
      await api.deleteCostComposition(token, item.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível excluir. Verifique se há orçamentos usando esta composição.');
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Serviços padronizados com material e mão de obra já embutidos — como o SINAPI/TCPO da construção civil.
        Em vez de montar item por item toda vez, você orça pela unidade do serviço e o sistema puxa os materiais e as horas automaticamente.
      </p>

      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Nova Composição</Button>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead><TableHead>Serviço</TableHead><TableHead>Un</TableHead>
              <TableHead>Material</TableHead><TableHead>Mão de Obra</TableHead><TableHead>Custo Unit.</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma composição cadastrada.</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground font-mono">{item.code || '-'}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className="font-mono">{fmt(item.costs.materialCost)}</TableCell>
                <TableCell className="font-mono">{fmt(item.costs.laborCost)}</TableCell>
                <TableCell className="font-mono font-semibold text-primary">{fmt(item.costs.unitCost)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Composição' : 'Nova Composição de Custo'}</DialogTitle></DialogHeader>
          <CostCompositionForm
            initialData={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setOpen(false); setEditing(undefined); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const regimeTaxEstimate: Record<string, number> = {
  SIMPLES: 6,
  LUCRO_PRESUMIDO: 13.3,
  LUCRO_REAL: 18.6,
  MEI: 0,
};

function monthKeyUTC(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function BreakEvenTab() {
  const { token } = useAuth();
  const [fixedTotal, setFixedTotal] = useState(0);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.listFixedExpenses(token),
      api.listFinanceEntries(token),
      api.listBudgets(token),
      api.getSettings(token),
      api.listAssets(token),
    ]).then(([fe, fin, b, s, assets]) => {
      setFixedTotal(
        fe.reduce((sum, e) => sum + e.amount, 0) +
        assets.reduce((sum, a) => sum + a.totalMonthlyCost, 0),
      );
      setEntries(fin);
      setBudgets(b);
      setSettings(s);
      setLoading(false);
    });
  }, [token]);

  if (loading || !settings) return <p className="text-muted-foreground">Carregando...</p>;

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const paid = entries.filter((e) => e.status === 'PAID' && e.paidAt);
  const monthsWithData = new Set<string>();
  let recSum = 0;
  let despSum = 0;
  months.forEach((mk) => {
    const rec = paid.filter((e) => e.type === 'INCOME' && monthKeyUTC(e.paidAt!) === mk).reduce((s, e) => s + (e.paidAmount ?? e.amount), 0);
    const desp = paid.filter((e) => e.type === 'EXPENSE' && monthKeyUTC(e.paidAt!) === mk).reduce((s, e) => s + (e.paidAmount ?? e.amount), 0);
    if (rec > 0 || desp > 0) { monthsWithData.add(mk); recSum += rec; despSum += desp; }
  });
  const n = monthsWithData.size;
  const recMed = n ? recSum / n : 0;
  const despMed = n ? despSum / n : 0;
  const mcPct = recMed > 0 ? ((recMed - despMed) / recMed) * 100 : 40;
  const impostosPct = regimeTaxEstimate[settings.defaultRegime] ?? 6;
  const mcLiq = Math.max(1, mcPct - impostosPct);
  const pontoEquilibrio = fixedTotal / (mcLiq / 100);
  const workDays = settings.overheadWorkDaysPerMonth ?? 22;
  const peDia = pontoEquilibrio / workDays;
  const folga = recMed - pontoEquilibrio;
  const margemSeguranca = recMed > 0 ? (folga / recMed) * 100 : 0;

  const validBudgets = budgets.filter((b) => b.totals.total > 0);
  const ticketMedio = validBudgets.length ? validBudgets.reduce((s, b) => s + b.totals.total, 0) / validBudgets.length : 0;
  const nObras = ticketMedio > 0 ? pontoEquilibrio / ticketMedio : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Quanto a empresa precisa faturar por mês para não dar prejuízo. Abaixo dessa linha você está pagando para trabalhar.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Ponto de Equilíbrio Mensal</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold font-mono text-warning">{fmt(pontoEquilibrio)}</p><p className="text-xs text-muted-foreground mt-1">Faturamento mínimo para não ter prejuízo</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Faturamento Médio Real</CardTitle></CardHeader>
          <CardContent><p className={`text-xl font-bold font-mono ${recMed >= pontoEquilibrio ? 'text-success' : 'text-destructive'}`}>{fmt(recMed)}</p><p className="text-xs text-muted-foreground mt-1">Média dos últimos {n || 0} mês(es) com receita</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Margem de Contribuição</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold font-mono text-info">{mcLiq.toFixed(1)}%</p><p className="text-xs text-muted-foreground mt-1">Depois de custo direto e impostos</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Margem de Segurança</CardTitle></CardHeader>
          <CardContent><p className={`text-xl font-bold font-mono ${margemSeguranca >= 20 ? 'text-success' : margemSeguranca >= 0 ? 'text-warning' : 'text-destructive'}`}>{margemSeguranca.toFixed(0)}%</p><p className="text-xs text-muted-foreground mt-1">{folga >= 0 ? `Folga de ${fmt(folga)}` : `Faltam ${fmt(-folga)}`}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Leitura do Cenário</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              Com <strong className="text-destructive">{fmt(fixedTotal)}</strong> de despesa fixa e margem de contribuição de <strong className="text-info">{mcLiq.toFixed(1)}%</strong>,
              a empresa precisa faturar <strong className="text-warning">{fmt(pontoEquilibrio)}</strong> por mês — cerca de <strong>{fmt(peDia)}</strong> por dia útil — só para empatar.
              {recMed > 0 ? (
                recMed >= pontoEquilibrio
                  ? <span className="text-success"> O faturamento médio está {fmt(folga)} acima do ponto de equilíbrio. Cada real acima disso é lucro operacional.</span>
                  : <span className="text-destructive"> O faturamento médio está {fmt(-folga)} abaixo do ponto de equilíbrio. Nesse ritmo a empresa consome caixa todo mês.</span>
              ) : <span className="text-muted-foreground"> Registre receitas pagas no financeiro para comparar com o ponto de equilíbrio real.</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-3">Margem de segurança abaixo de 20% é sinal de operação frágil: uma obra atrasada ou um cliente inadimplente já leva o mês para o vermelho.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Quantas Obras Para Empatar</CardTitle></CardHeader>
          <CardContent>
            {ticketMedio > 0 ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-border"><span className="text-muted-foreground">Ticket médio dos orçamentos</span><span className="font-mono text-primary">{fmt(ticketMedio)}</span></div>
                <div className="flex justify-between py-1 border-b border-border"><span className="text-muted-foreground">Obras/mês para empatar</span><span className="font-mono text-warning">{nObras.toFixed(1)}</span></div>
                <div className="flex justify-between py-1"><span className="text-muted-foreground">Obras/mês para 20% de lucro</span><span className="font-mono text-success">{(nObras * 1.25).toFixed(1)}</span></div>
                <p className="text-xs text-muted-foreground pt-2">Se fechar menos de <strong>{Math.ceil(nObras)}</strong> obra(s) no mês, o resultado fica negativo. Use isso como meta comercial mínima.</p>
              </div>
            ) : <p className="text-sm text-muted-foreground">Cadastre orçamentos para calcular o ticket médio.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CustosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custos</h1>
        <p className="text-muted-foreground">Despesas fixas, taxa administrativa e composições de custo unitário.</p>
      </div>
      <Tabs defaultValue="despesas">
        <TabsList>
          <TabsTrigger value="despesas">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="patrimonio">Patrimônio</TabsTrigger>
          <TabsTrigger value="taxa">Taxa Administrativa</TabsTrigger>
          <TabsTrigger value="composicoes">Composições</TabsTrigger>
          <TabsTrigger value="equilibrio">Ponto de Equilíbrio</TabsTrigger>
        </TabsList>
        <TabsContent value="despesas"><FixedExpensesTab /></TabsContent>
        <TabsContent value="patrimonio"><AssetsTab /></TabsContent>
        <TabsContent value="taxa"><OverheadTab /></TabsContent>
        <TabsContent value="composicoes"><CompositionsTab /></TabsContent>
        <TabsContent value="equilibrio"><BreakEvenTab /></TabsContent>
      </Tabs>
    </div>
  );
}
