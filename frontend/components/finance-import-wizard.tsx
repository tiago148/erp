'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  api, FinanceCategory, FinanceImportPreview, FinanceImportResult,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

function previewAmountSign(raw: string): 'INCOME' | 'EXPENSE' | null {
  const cleaned = (raw || '').trim().replace(/[R$\s]/g, '');
  if (!cleaned) return null;
  let normalized = cleaned;
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  if (hasComma && hasDot) normalized = normalized.replace(/\./g, '').replace(',', '.');
  else if (hasComma) normalized = normalized.replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value) || value === 0) return null;
  return value > 0 ? 'INCOME' : 'EXPENSE';
}

export function FinanceImportWizard() {
  const { token } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FinanceImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [dateColumnIndex, setDateColumnIndex] = useState(-1);
  const [descriptionColumnIndex, setDescriptionColumnIndex] = useState(-1);
  const [amountColumnIndex, setAmountColumnIndex] = useState(-1);

  const [incomeCategories, setIncomeCategories] = useState<FinanceCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<FinanceCategory[]>([]);
  const [incomeCategoryId, setIncomeCategoryId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');

  const [result, setResult] = useState<FinanceImportResult | null>(null);

  useEffect(() => {
    if (!token || step !== 2) return;
    api.listFinanceCategories(token, 'INCOME').then(setIncomeCategories);
    api.listFinanceCategories(token, 'EXPENSE').then(setExpenseCategories);
  }, [token, step]);

  function reset() {
    setStep(1);
    setFile(null);
    setPreview(null);
    setError('');
    setDateColumnIndex(-1);
    setDescriptionColumnIndex(-1);
    setAmountColumnIndex(-1);
    setIncomeCategoryId('');
    setExpenseCategoryId('');
    setResult(null);
  }

  async function handleAnalyze() {
    if (!token || !file) return;
    setError('');
    setLoading(true);
    try {
      const p = await api.previewFinanceImport(token, file);
      setPreview(p);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ler o arquivo CSV');
    } finally {
      setLoading(false);
    }
  }

  function columnLabel(idx: number) {
    if (hasHeaderRow && preview?.rows[0]?.[idx]) return `${preview.rows[0][idx]} (col. ${idx + 1})`;
    return `Coluna ${idx + 1}`;
  }

  async function handleImport() {
    if (!token || !file) return;
    if (dateColumnIndex < 0 || descriptionColumnIndex < 0 || amountColumnIndex < 0) {
      setError('Selecione as colunas de data, descrição e valor.');
      return;
    }
    if (!incomeCategoryId || !expenseCategoryId) {
      setError('Selecione a categoria de receita e a categoria de despesa.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const r = await api.importFinanceCsv(token, file, {
        hasHeaderRow, dateColumnIndex, descriptionColumnIndex, amountColumnIndex,
        incomeCategoryId, expenseCategoryId,
      });
      setResult(r);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar o arquivo');
    } finally {
      setLoading(false);
    }
  }

  const dataRows = preview ? (hasHeaderRow ? preview.rows.slice(1) : preview.rows) : [];
  const columnCount = preview?.columnCount || 0;

  if (step === 1) {
    return (
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Importar Extrato (CSV)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Envie um arquivo CSV exportado do seu banco. Na próxima etapa você indica quais colunas são data, descrição e valor.
            Cada linha vira um lançamento já pago/recebido (histórico), conforme o sinal do valor.
          </p>
          <div className="space-y-2">
            <Label>Arquivo CSV</Label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-input file:bg-white file:text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleAnalyze} disabled={!file || loading}>
            <Upload size={16} className="mr-2" />{loading ? 'Analisando...' : 'Analisar Arquivo'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 2 && preview) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Card>
          <CardHeader><CardTitle className="text-base">Mapeamento de Colunas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hasHeaderRow} onChange={(e) => setHasHeaderRow(e.target.checked)} />
              A primeira linha é cabeçalho (não será importada)
            </label>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Coluna da Data</Label>
                <Select value={String(dateColumnIndex)} onValueChange={(v) => setDateColumnIndex(Number(v))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{dateColumnIndex >= 0 ? columnLabel(dateColumnIndex) : undefined}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: columnCount }).map((_, i) => <SelectItem key={i} value={String(i)}>{columnLabel(i)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coluna da Descrição</Label>
                <Select value={String(descriptionColumnIndex)} onValueChange={(v) => setDescriptionColumnIndex(Number(v))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{descriptionColumnIndex >= 0 ? columnLabel(descriptionColumnIndex) : undefined}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: columnCount }).map((_, i) => <SelectItem key={i} value={String(i)}>{columnLabel(i)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coluna do Valor</Label>
                <Select value={String(amountColumnIndex)} onValueChange={(v) => setAmountColumnIndex(Number(v))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{amountColumnIndex >= 0 ? columnLabel(amountColumnIndex) : undefined}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: columnCount }).map((_, i) => <SelectItem key={i} value={String(i)}>{columnLabel(i)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-gray-400">Valor positivo vira receita, valor negativo vira despesa (valor absoluto é usado no lançamento).</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria para valores positivos (Receita)</Label>
                <Select value={incomeCategoryId} onValueChange={setIncomeCategoryId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{incomeCategories.find((c) => c.id === incomeCategoryId)?.name}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {incomeCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {incomeCategories.length === 0 && <p className="text-xs text-amber-600">Nenhuma categoria de receita cadastrada — crie uma na aba Categorias.</p>}
              </div>
              <div className="space-y-2">
                <Label>Categoria para valores negativos (Despesa)</Label>
                <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione...">{expenseCategories.find((c) => c.id === expenseCategoryId)?.name}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {expenseCategories.length === 0 && <p className="text-xs text-amber-600">Nenhuma categoria de despesa cadastrada — crie uma na aba Categorias.</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pré-visualização ({dataRows.length} linha(s) de dados)</CardTitle></CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataRows.slice(0, 10).map((row, idx) => {
                    const sign = amountColumnIndex >= 0 ? previewAmountSign(row[amountColumnIndex]) : null;
                    return (
                      <TableRow key={idx}>
                        <TableCell>{dateColumnIndex >= 0 ? row[dateColumnIndex] : '-'}</TableCell>
                        <TableCell>{descriptionColumnIndex >= 0 ? row[descriptionColumnIndex] : '-'}</TableCell>
                        <TableCell>{amountColumnIndex >= 0 ? row[amountColumnIndex] : '-'}</TableCell>
                        <TableCell>
                          {sign === 'INCOME' && <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Receita</span>}
                          {sign === 'EXPENSE' && <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Despesa</span>}
                          {sign === null && <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Indefinido</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {dataRows.length > 10 && <p className="text-xs text-gray-400 mt-2">Mostrando as 10 primeiras de {dataRows.length} linhas.</p>}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>Voltar</Button>
          <Button onClick={handleImport} disabled={loading}>{loading ? 'Importando...' : `Importar ${dataRows.length} lançamento(s)`}</Button>
        </div>
      </div>
    );
  }

  if (step === 3 && result) {
    return (
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Resultado da Importação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 size={18} />
            <span>{result.imported} lançamento(s) importado(s) com sucesso.</span>
          </div>
          {result.skipped.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle size={18} />
                <span>{result.skipped.length} linha(s) ignorada(s):</span>
              </div>
              <ul className="text-xs text-gray-500 space-y-1 max-h-40 overflow-y-auto border rounded-md p-2">
                {result.skipped.map((s, i) => <li key={i}>Linha {s.row}: {s.reason}</li>)}
              </ul>
            </div>
          )}
          <Button onClick={reset}>Nova Importação</Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
