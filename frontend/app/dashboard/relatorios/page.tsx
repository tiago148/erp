'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Budget, Project, StockItem, Tool, PurchaseOrder, Client } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { downloadCsv } from '@/lib/export-csv';
import { AlertTriangle, Package, Wrench, ShoppingCart, TrendingUp, Download } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const budgetStatusLabels: Record<string, string> = {
  DRAFT: 'Rascunho', SENT: 'Enviado', APPROVED: 'Aprovado', REJECTED: 'Recusado', NEGOTIATING: 'Em Negociação',
};
const projectStatusLabels: Record<string, string> = {
  PLANNING: 'Planejamento', IN_PROGRESS: 'Em Andamento', ON_HOLD: 'Pausado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
};

const COLORS = ['#c8a96e', '#4a9ede', '#4caf82', '#e05555', '#e0a030'];

export default function RelatoriosPage() {
  const { token } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.listBudgets(token),
      api.listProjects(token),
      api.listStockItems(token),
      api.listTools(token),
      api.listPurchaseOrders(token),
      api.listClients(token),
    ]).then(([b, p, s, t, po, c]) => {
      setBudgets(b);
      setProjects(p);
      setStockItems(s);
      setTools(t);
      setPurchaseOrders(po);
      setClients(c);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return <p className="text-muted-foreground">Carregando relatórios...</p>;
  }

  // Orçamentos por status
  const budgetsByStatus = Object.entries(budgetStatusLabels).map(([key, label]) => ({
    status: label,
    quantidade: budgets.filter((b) => b.status === key).length,
    valor: budgets.filter((b) => b.status === key).reduce((s, b) => s + b.totals.total, 0),
  })).filter((item) => item.quantidade > 0);

  // Projetos por status
  const projectsByStatus = Object.entries(projectStatusLabels).map(([key, label]) => ({
    name: label,
    value: projects.filter((p) => p.status === key).length,
  })).filter((item) => item.value > 0);

  // Taxa de conversão de orçamentos
  const totalBudgetsDecided = budgets.filter((b) => b.status === 'APPROVED' || b.status === 'REJECTED').length;
  const approvedCount = budgets.filter((b) => b.status === 'APPROVED').length;
  const conversionRate = totalBudgetsDecided > 0 ? (approvedCount / totalBudgetsDecided) * 100 : 0;

  // Ranking de clientes por valor aprovado
  const clientRanking = clients
    .map((client) => {
      const approved = budgets.filter((b) => b.clientId === client.id && b.status === 'APPROVED');
      const total = approved.reduce((s, b) => s + b.totals.total, 0);
      return { name: client.name, total, count: approved.length };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Estoque baixo
  const lowStock = stockItems.filter((s) => s.quantity <= s.minQuantity);

  // Ferramentas fora da empresa
  const toolsOut = tools.filter((t) => t.currentLocation === 'PROJECT');

  // Pedidos de compra pendentes
  const pendingOrders = purchaseOrders.filter((po) => po.status === 'PENDING');
  const pendingOrdersValue = pendingOrders.reduce(
    (s, po) => s + po.items.reduce((si, i) => si + i.quantity * i.unitCost, 0),
    0,
  );

  function handleExport() {
    downloadCsv('relatorios.csv', [
      ['Orçamentos por Status'],
      ['Status', 'Quantidade', 'Valor'],
      ...budgetsByStatus.map((b) => [b.status, b.quantidade, b.valor]),
      [],
      ['Projetos por Status'],
      ['Status', 'Quantidade'],
      ...projectsByStatus.map((p) => [p.name, p.value]),
      [],
      ['Top Clientes (por orçamento aprovado)'],
      ['Cliente', 'Orçamentos Aprovados', 'Valor Total'],
      ...clientRanking.map((c) => [c.name, c.count, c.total]),
      [],
      ['Estoque Baixo'],
      ['Material', 'Quantidade', 'Mínimo'],
      ...lowStock.map((s) => [s.material.name, s.quantity, s.minQuantity]),
      [],
      ['Ferramentas em Obra'],
      ['Ferramenta', 'Projeto'],
      ...toolsOut.map((t) => [t.name, t.currentProject?.name || '-']),
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Indicadores consolidados do sistema.</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download size={16} className="mr-2" />Exportar CSV
        </Button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
            <TrendingUp size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{approvedCount} de {totalBudgetsDecided} orçamentos decididos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Itens em Estoque Baixo</CardTitle>
            <Package size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lowStock.length}</p>
            <p className="text-xs text-muted-foreground">de {stockItems.length} itens cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ferramentas em Obra</CardTitle>
            <Wrench size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{toolsOut.length}</p>
            <p className="text-xs text-muted-foreground">de {tools.length} ferramentas cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compras Pendentes</CardTitle>
            <ShoppingCart size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(pendingOrdersValue)}</p>
            <p className="text-xs text-muted-foreground">{pendingOrders.length} pedido(s) aguardando</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Orçamentos por Status</CardTitle></CardHeader>
          <CardContent>
            {budgetsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum orçamento cadastrado.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={budgetsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e3138" />
                  <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#8b929e' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#8b929e' }} />
                  <Tooltip formatter={(value: number) => value} contentStyle={{ background: '#1e2026', border: '1px solid #2e3138', borderRadius: 8, color: '#d8dce6' }} />
                  <Bar dataKey="quantidade" fill="#c8a96e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Projetos por Status</CardTitle></CardHeader>
          <CardContent>
            {projectsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto cadastrado.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={projectsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {projectsByStatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e2026', border: '1px solid #2e3138', borderRadius: 8, color: '#d8dce6' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#8b929e' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking de clientes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top Clientes (por orçamento aprovado)</CardTitle></CardHeader>
        <CardContent>
          {clientRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum orçamento aprovado ainda.</p>
          ) : (
            <div className="space-y-2">
              {clientRanking.map((c, idx) => (
                <div key={c.name} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{idx + 1}</span>
                    {c.name}
                  </span>
                  <span className="text-muted-foreground">{c.count} orçamento(s)</span>
                  <span className="font-semibold">{fmt(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle size={16} className="text-destructive" />Estoque Baixo</CardTitle></CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item abaixo do mínimo.</p>
            ) : (
              <div className="space-y-1">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span>{item.material.name}</span>
                    <span className="text-destructive font-medium">{item.quantity} / {item.minQuantity} {item.material.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wrench size={16} className="text-info" />Ferramentas em Obra</CardTitle></CardHeader>
          <CardContent>
            {toolsOut.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todas as ferramentas estão na empresa.</p>
            ) : (
              <div className="space-y-1">
                {toolsOut.map((tool) => (
                  <div key={tool.id} className="flex justify-between text-sm py-1">
                    <span>{tool.name}</span>
                    <span className="text-info">{tool.currentProject?.name || '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}