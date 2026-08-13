'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, StockItem, Training, Tool, Budget, Project, Vehicle, VehicleMaintenance } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Package, ShieldAlert, Wrench, FileCheck, Truck } from 'lucide-react';

function daysBetween(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export default function AutomacoesPage() {
  const { token } = useAuth();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleMaintenances, setVehicleMaintenances] = useState<VehicleMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.listStockItems(token),
      api.listTrainings(token),
      api.listTools(token),
      api.listBudgets(token),
      api.listProjects(token),
      api.listVehicles(token),
      api.listVehicleMaintenances(token),
    ]).then(([s, t, tl, b, p, v, vm]) => {
      setStockItems(s);
      setTrainings(t);
      setTools(tl);
      setBudgets(b);
      setProjects(p);
      setVehicles(v);
      setVehicleMaintenances(vm);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  const lowStock = stockItems.filter((s) => s.quantity <= s.minQuantity);

  const trainingAlerts = trainings.filter((t) => t.expiresAt && daysBetween(t.expiresAt) <= 30);

  const toolsOutTooLong = tools.filter((t) => {
    if (t.currentLocation !== 'PROJECT' || t.movements.length === 0) return false;
    const lastMove = t.movements[0];
    return daysSince(lastMove.movedAt) > 30;
  });

  const approvedWithoutProject = budgets.filter(
    (b) => b.status === 'APPROVED' && !projects.some((p) => p.budgetId === b.id),
  );

  const vehiclesDueForReview = vehicles
    .filter((v) => v.reviewIntervalKm)
    .map((v) => {
      const lastMaintenanceKm = vehicleMaintenances
        .filter((m) => m.vehicleId === v.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.km ?? v.initialKm;
      const kmSinceLastMaintenance = v.currentKm - lastMaintenanceKm;
      return { vehicle: v, kmSinceLastMaintenance };
    })
    .filter(({ vehicle, kmSinceLastMaintenance }) => kmSinceLastMaintenance >= (vehicle.reviewIntervalKm as number));

  const totalAlerts = lowStock.length + trainingAlerts.length + toolsOutTooLong.length + approvedWithoutProject.length + vehiclesDueForReview.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Automações</h1>
        <p className="text-muted-foreground">
          {totalAlerts === 0 ? 'Nenhum alerta pendente no momento.' : `${totalAlerts} alerta(s) que precisam de atenção.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Package size={18} className="text-destructive" />
            <CardTitle className="text-base">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item abaixo do mínimo.</p>
            ) : (
              <>
                {lowStock.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span>{item.material.name}</span>
                    <span className="text-destructive font-medium">{item.quantity} / {item.minQuantity} {item.material.unit}</span>
                  </div>
                ))}
                <Link href="/dashboard/compras">
                  <Button variant="outline" size="sm" className="mt-2">Criar Pedido de Compra</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ShieldAlert size={18} className="text-warning" />
            <CardTitle className="text-base">Treinamentos Vencendo/Vencidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trainingAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum treinamento vencendo nos próximos 30 dias.</p>
            ) : (
              <>
                {trainingAlerts.map((t) => {
                  const days = daysBetween(t.expiresAt!);
                  return (
                    <div key={t.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span>{t.employee.name} — {t.nrType}</span>
                      <span className={days < 0 ? 'text-destructive font-medium' : 'text-warning font-medium'}>
                        {days < 0 ? `Vencido há ${Math.abs(days)}d` : `${days}d restantes`}
                      </span>
                    </div>
                  );
                })}
                <Link href="/dashboard/seguranca">
                  <Button variant="outline" size="sm" className="mt-2">Ver Treinamentos</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Wrench size={18} className="text-info" />
            <CardTitle className="text-base">Ferramentas Fora Há Muito Tempo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {toolsOutTooLong.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma ferramenta fora há mais de 30 dias.</p>
            ) : (
              <>
                {toolsOutTooLong.map((tool) => (
                  <div key={tool.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span>{tool.name}</span>
                    <span className="text-info">{tool.currentProject?.name} ({daysSince(tool.movements[0].movedAt)}d)</span>
                  </div>
                ))}
                <Link href="/dashboard/equipamentos">
                  <Button variant="outline" size="sm" className="mt-2">Ver Ferramentas</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FileCheck size={18} className="text-success" />
            <CardTitle className="text-base">Orçamentos Aprovados sem Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approvedWithoutProject.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos os orçamentos aprovados já viraram projeto.</p>
            ) : (
              <>
                {approvedWithoutProject.map((b) => (
                  <div key={b.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span>{b.number} — {b.client.name}</span>
                  </div>
                ))}
                <Link href="/dashboard/projetos">
                  <Button variant="outline" size="sm" className="mt-2">Criar Projeto</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Truck size={18} className="text-purple-400" />
            <CardTitle className="text-base">Veículos com Revisão Pendente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vehiclesDueForReview.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum veículo precisa de revisão no momento.</p>
            ) : (
              <>
                {vehiclesDueForReview.map(({ vehicle, kmSinceLastMaintenance }) => (
                  <div key={vehicle.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span>{vehicle.name} ({vehicle.plate})</span>
                    <span className="text-purple-400 font-medium">{kmSinceLastMaintenance.toLocaleString('pt-BR')} km desde a última manutenção</span>
                  </div>
                ))}
                <Link href="/dashboard/equipamentos">
                  <Button variant="outline" size="sm" className="mt-2">Ver Veículos</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}