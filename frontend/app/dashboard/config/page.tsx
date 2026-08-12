'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Settings } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';

const regimeLabels: Record<string, string> = {
  SIMPLES: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
  MEI: 'MEI',
};

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
        defaultBdiPct: settings.defaultBdiPct,
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
    return <p className="text-gray-500">Carregando...</p>;
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-gray-500">Dados da empresa e valores padrão do sistema.</p>
      </div>

      {!isAdmin && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
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
            <p className="text-xs text-gray-400">Usados como sugestão inicial ao criar novos orçamentos — você ainda pode ajustar em cada um.</p>
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
                <Label>BDI Padrão (%)</Label>
                <Input type="number" step="0.5" disabled={!isAdmin} value={settings.defaultBdiPct} onChange={(e) => set('defaultBdiPct', parseFloat(e.target.value) || 0)} />
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
            <p className="text-xs text-gray-400">Limites usados para colorir o indicador de margem nos orçamentos (verde = saudável, amarelo = reduzida, vermelho = crítica).</p>
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
            <p className="text-xs text-gray-400">Abaixo do limite de margem reduzida, o indicador fica vermelho (crítica).</p>
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

      <Card>
        <CardHeader><CardTitle className="text-base">Backup</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">Exporta todos os dados do sistema em um arquivo JSON.</p>
          {isAdmin ? (
            <Button variant="outline" onClick={handleBackup}>
              <Download size={16} className="mr-2" />Baixar Backup Completo
            </Button>
          ) : (
            <p className="text-xs text-amber-600">Apenas administradores podem exportar backup.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}