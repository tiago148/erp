'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Package, Wallet } from 'lucide-react';

const summaryCards = [
  { label: 'Clientes ativos', value: '—', icon: Users },
  { label: 'Orçamentos no mês', value: '—', icon: FileText },
  { label: 'Itens em estoque', value: '—', icon: Package },
  { label: 'Faturamento no mês', value: '—', icon: Wallet },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Olá, {user?.name}</h1>
        <p className="text-gray-500">Aqui está um resumo do seu sistema.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {card.label}
                </CardTitle>
                <Icon size={18} className="text-gray-400" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos módulos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          Clientes, Orçamentos, Estoque e Financeiro ainda serão implementados —
          os cards acima vão ganhar dados reais conforme cada módulo for criado.
        </CardContent>
      </Card>
    </div>
  );
}