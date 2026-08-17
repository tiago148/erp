'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Settings, AuditLog, PriceAdjustment, PriceAdjustmentTarget } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';

const regimeLabels: Record<string, string> = {
  SIMPLES: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
  MEI: 'MEI',
};

const actionLabels: Record<string, string> = {
  LOGIN_SUCCESS: 'Login',
  LOGIN_FAILED: 'Falha de login',
  USER_CREATE: 'Usuário criado',
  SETTINGS_UPDATE: 'Configurações alteradas',
  BUDGET_STATUS_CHANGE: 'Status de orçamento alterado',
  FIXED_EXPENSE_CREATE: 'Despesa fixa criada',
  FIXED_EXPENSE_UPDATE: 'Despesa fixa alterada',
  FIXED_EXPENSE_DELETE: 'Despesa fixa excluída',
  USER_MODULES_UPDATE: 'Módulos de usuário alterados',
  BACKUP_RESTORE: 'Backup restaurado',
  PRICE_ADJUSTMENT: 'Reajuste em bloco',
};

const actionVariants: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'accent'> = {
  LOGIN_SUCCESS: 'success',
  LOGIN_FAILED: 'danger',
  USER_CREATE: 'info',
  SETTINGS_UPDATE: 'accent',
  BUDGET_STATUS_CHANGE: 'accent',
  FIXED_EXPENSE_CREATE: 'success',
  FIXED_EXPENSE_UPDATE: 'warning',
  FIXED_EXPENSE_DELETE: 'danger',
  USER_MODULES_UPDATE: 'accent',
  BACKUP_RESTORE: 'danger',
  PRICE_ADJUSTMENT: 'warning',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR');
}

function AuditTab() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setLogs(await api.listAuditLogs(token, actionFilter || undefined));
    } finally {
      setLoading(false);
    }
  }, [token, actionFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Login e eventos de alto valor: usuários, configurações, status de orçamento e despesas fixas.</p>
        <Select value={actionFilter || 'ALL'} onValueChange={(v) => setActionFilter(!v || v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-56"><SelectValue>{actionFilter ? actionLabels[actionFilter] : 'Todas as ações'}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as ações</SelectItem>
            {Object.entries(actionLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum evento registrado.</TableCell></TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell>{log.userEmail || '—'}</TableCell>
                  <TableCell><Badge variant={actionVariants[log.action] ?? 'accent'}>{actionLabels[log.action] ?? log.action}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{log.details || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const RESTORE_CONFIRMATION_PHRASE = 'RESTAURAR';

const priceAdjustmentTargetLabels: Record<PriceAdjustmentTarget, string> = {
  LABOR_ROLE: 'Mão de Obra (taxa/hora)',
  MATERIAL: 'Materiais (custo unitário)',
  FIXED_EXPENSE: 'Despesas Fixas (valor mensal)',
};

function PriceAdjustmentsCard() {
  const { token } = useAuth();
  const [history, setHistory] = useState<PriceAdjustment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [target, setTarget] = useState<PriceAdjustmentTarget>('MATERIAL');
  const [percentage, setPercentage] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      setHistory(await api.listPriceAdjustments(token));
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function handleApply() {
    if (!token) return;
    const pct = parseFloat(percentage);
    if (!pct) { setMessageIsError(true); setMessage('Informe um percentual diferente de zero.'); return; }
    setMessage('');
    setMessageIsError(false);
    setSaving(true);
    try {
      const result = await api.createPriceAdjustment(token, {
        target,
        percentage: pct,
        categoryFilter: categoryFilter || undefined,
      });
      setMessage(`Reajuste aplicado a ${result.itemsAffected} item(ns).`);
      setPercentage('');
      setCategoryFilter('');
      loadHistory();
    } catch (err) {
      setMessageIsError(true);
      setMessage(err instanceof Error ? err.message : 'Erro ao aplicar reajuste');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Reajustar em Bloco</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Aplica um percentual de aumento (ou redução, com valor negativo) sobre toda uma categoria de preços de uma vez —
          útil para repassar dissídio de mão de obra, reajuste de fornecedor ou correção de despesas fixas.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>O que reajustar</Label>
            <Select value={target} onValueChange={(v) => setTarget((v || 'MATERIAL') as PriceAdjustmentTarget)}>
              <SelectTrigger><SelectValue>{priceAdjustmentTargetLabels[target]}</SelectValue></SelectTrigger>
              <SelectContent>
                {(Object.keys(priceAdjustmentTargetLabels) as PriceAdjustmentTarget[]).map((t) => (
                  <SelectItem key={t} value={t}>{priceAdjustmentTargetLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Percentual (%)</Label>
            <Input type="number" step="0.1" placeholder="Ex: 5 ou -3" value={percentage} onChange={(e) => setPercentage(e.target.value)} />
          </div>
          {target !== 'LABOR_ROLE' && (
            <div className="space-y-2">
              <Label>Categoria (opcional — deixe em branco para todos)</Label>
              <Input value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} />
            </div>
          )}
        </div>
        {message && <p className={`text-sm ${messageIsError ? 'text-destructive' : 'text-success'}`}>{message}</p>}
        <Button onClick={handleApply} disabled={saving}>{saving ? 'Aplicando...' : 'Aplicar Reajuste'}</Button>

        <div className="border rounded-md bg-card mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Alvo</TableHead><TableHead>Percentual</TableHead>
                <TableHead>Categoria</TableHead><TableHead>Itens</TableHead><TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingHistory ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : history.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum reajuste em bloco aplicado ainda.</TableCell></TableRow>
              ) : history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-muted-foreground">{formatDateTime(h.createdAt)}</TableCell>
                  <TableCell>{priceAdjustmentTargetLabels[h.target]}</TableCell>
                  <TableCell className={`font-mono ${h.percentage >= 0 ? 'text-success' : 'text-destructive'}`}>{h.percentage > 0 ? '+' : ''}{h.percentage}%</TableCell>
                  <TableCell className="text-muted-foreground">{h.categoryFilter || 'Todas'}</TableCell>
                  <TableCell>{h.itemsAffected}</TableCell>
                  <TableCell className="text-muted-foreground">{h.actorEmail || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function RestoreBackupCard() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);

  async function handleRestore() {
    if (!token || !file) return;
    setMessage('');
    setMessageIsError(false);
    setRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.restoreBackup(token, confirmText, parsed);
      setMessage('Backup restaurado com sucesso. Recarregue a página para ver os dados atualizados.');
      setFile(null);
      setConfirmText('');
    } catch (err) {
      setMessageIsError(true);
      setMessage(err instanceof Error ? err.message : 'Erro ao restaurar backup');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader><CardTitle className="text-base text-destructive">Restaurar Backup</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-destructive/90 bg-destructive/10 border border-destructive/30 rounded-md p-3">
          <strong>Ação destrutiva e irreversível.</strong> Restaurar um backup apaga permanentemente todos os dados atuais de clientes, materiais, mão de obra, veículos, orçamentos, obras, ferramentas, estoque, diário de obra, fornecedores, compras, financeiro e faturamento — substituindo-os pelo conteúdo do arquivo. Dados de segurança do trabalho, cotações, tarefas, despesas fixas, composições de custo, documentos com vencimento e auditoria não são afetados. Use apenas com um backup confiável e gerado por este sistema.
        </p>
        <div className="space-y-2">
          <Label>Arquivo de backup (.json)</Label>
          <input
            type="file"
            accept="application/json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label>Digite <span className="font-mono text-destructive">{RESTORE_CONFIRMATION_PHRASE}</span> para confirmar</Label>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={RESTORE_CONFIRMATION_PHRASE} />
        </div>
        {message && (
          <p className={`text-sm ${messageIsError ? 'text-destructive' : 'text-success'}`}>{message}</p>
        )}
        <Button
          variant="destructive"
          disabled={!file || confirmText !== RESTORE_CONFIRMATION_PHRASE || restoring}
          onClick={handleRestore}
        >
          {restoring ? 'Restaurando...' : 'Restaurar Backup Agora'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ConfigPage() {
  const { token, user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    api.getSettings(token).then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, [token]);

  function set<K extends keyof Settings>(field: K, value: Settings[K]) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !settings) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.updateSettings(token, {
        companyName: settings.companyName,
        companyDocument: settings.companyDocument,
        companyIe: settings.companyIe,
        companyAddress: settings.companyAddress,
        companyPhone: settings.companyPhone,
        companyEmail: settings.companyEmail,
        defaultRegime: settings.defaultRegime,
        defaultLucroPct: settings.defaultLucroPct,
        defaultContingenciaPct: settings.defaultContingenciaPct,
        defaultTaxaCapitalPct: settings.defaultTaxaCapitalPct,
        defaultChargesPct: settings.defaultChargesPct,
        defaultFuelPrice: settings.defaultFuelPrice,
        budgetPrefix: settings.budgetPrefix,
        projectPrefix: settings.projectPrefix,
        marginHealthyPct: settings.marginHealthyPct,
        marginWarningPct: settings.marginWarningPct,
      });
      setSettings(updated);
      setMessage('Configurações salvas com sucesso.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleBackup() {
    if (!token) return;
    const response = await fetch(api.getBackupUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-erp-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !settings) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Dados da empresa, valores padrão do sistema e auditoria.</p>
      </div>

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Configurações</TabsTrigger>
          {isAdmin && <TabsTrigger value="auditoria">Auditoria</TabsTrigger>}
        </TabsList>

        <TabsContent value="geral">
    <div className="space-y-6 max-w-3xl">
      {!isAdmin && (
        <p className="text-sm text-warning bg-warning/10 border border-warning/30 rounded-md p-3">
          Apenas administradores podem editar as configurações. Você pode visualizar.
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Dados da Empresa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input disabled={!isAdmin} value={settings.companyName} onChange={(e) => set('companyName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input disabled={!isAdmin} value={settings.companyDocument || ''} onChange={(e) => set('companyDocument', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inscrição Estadual</Label>
                <Input disabled={!isAdmin} value={settings.companyIe || ''} onChange={(e) => set('companyIe', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input disabled={!isAdmin} value={settings.companyPhone || ''} onChange={(e) => set('companyPhone', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" disabled={!isAdmin} value={settings.companyEmail || ''} onChange={(e) => set('companyEmail', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input disabled={!isAdmin} value={settings.companyAddress || ''} onChange={(e) => set('companyAddress', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Valores Padrão</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Usados como sugestão inicial ao criar novos orçamentos — você ainda pode ajustar em cada um.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Regime Tributário Padrão</Label>
                <Select value={settings.defaultRegime} onValueChange={(v) => set('defaultRegime', v as any)} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue>{regimeLabels[settings.defaultRegime]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIMPLES">Simples Nacional</SelectItem>
                    <SelectItem value="LUCRO_PRESUMIDO">Lucro Presumido</SelectItem>
                    <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                    <SelectItem value="MEI">MEI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Margem de Lucro Padrão (%)</Label>
                <Input type="number" step="0.5" disabled={!isAdmin} value={settings.defaultLucroPct} onChange={(e) => set('defaultLucroPct', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contingência Padrão (%)</Label>
                <Input type="number" step="0.5" disabled={!isAdmin} value={settings.defaultContingenciaPct} onChange={(e) => set('defaultContingenciaPct', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Taxa de Capital Padrão (% ao mês)</Label>
                <Input type="number" step="0.1" disabled={!isAdmin} value={settings.defaultTaxaCapitalPct} onChange={(e) => set('defaultTaxaCapitalPct', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Encargos CLT Padrão (%)</Label>
                <Input type="number" step="0.5" disabled={!isAdmin} value={settings.defaultChargesPct} onChange={(e) => set('defaultChargesPct', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Preço de Combustível Padrão (R$/l)</Label>
                <Input type="number" step="0.01" disabled={!isAdmin} value={settings.defaultFuelPrice} onChange={(e) => set('defaultFuelPrice', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Margem de Orçamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Limites usados para colorir o indicador de margem nos orçamentos (verde = saudável, amarelo = reduzida, vermelho = crítica).</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Margem Saudável a partir de (%)</Label>
                <Input type="number" step="1" disabled={!isAdmin} value={settings.marginHealthyPct} onChange={(e) => set('marginHealthyPct', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Margem Reduzida a partir de (%)</Label>
                <Input type="number" step="1" disabled={!isAdmin} value={settings.marginWarningPct} onChange={(e) => set('marginWarningPct', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Abaixo do limite de margem reduzida, o indicador fica vermelho (crítica).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Numeração de Documentos</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prefixo de Orçamentos</Label>
              <Input disabled={!isAdmin} value={settings.budgetPrefix} onChange={(e) => set('budgetPrefix', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Prefixo de Projetos</Label>
              <Input disabled={!isAdmin} value={settings.projectPrefix} onChange={(e) => set('projectPrefix', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {message && <p className="text-sm">{message}</p>}

        {isAdmin && (
          <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Configurações'}</Button>
        )}
      </form>

      {isAdmin && <PriceAdjustmentsCard />}

      <Card>
        <CardHeader><CardTitle className="text-base">Backup</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Exporta todos os dados do sistema em um arquivo JSON.</p>
          {isAdmin ? (
            <Button variant="outline" onClick={handleBackup}>
              <Download size={16} className="mr-2" />Baixar Backup Completo
            </Button>
          ) : (
            <p className="text-xs text-warning">Apenas administradores podem exportar backup.</p>
          )}
        </CardContent>
      </Card>

      {isAdmin && <RestoreBackupCard />}
    </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="auditoria">
            <AuditTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}