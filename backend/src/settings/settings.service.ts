import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, Actor } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { computeSocialCharges } from '../common/social-charges';
import { round2 } from '../common/money';

const RESTORE_CONFIRMATION_PHRASE = 'RESTAURAR';

// Prisma rejects a relation field (nested arrays) or the parent's own FK
// (inside a nested `create`) when it is implied by context. Backup exports
// carry both on every row, so they must be stripped before feeding them
// back as a nested write or a bare top-level create.
function omitKey(item: any, key: string): any {
  const copy = { ...item };
  delete copy[key];
  return copy;
}

function stripFk(items: any[] | undefined, fkKey: string): any[] {
  return (items ?? []).map((item) => omitKey(item, fkKey));
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async get() {
    const existing = await this.prisma.client.settings.findFirst();
    if (existing) return existing;

    return this.prisma.client.settings.create({ data: {} });
  }

  async update(dto: UpdateSettingsDto, actor?: Actor) {
    const current = await this.get();
    const changedKeys = Object.keys(dto).filter(
      (key) =>
        (dto as Record<string, unknown>)[key] !== undefined &&
        (dto as Record<string, unknown>)[key] !==
          (current as Record<string, unknown>)[key],
    );
    const updated = await this.prisma.client.settings.update({
      where: { id: current.id },
      data: dto,
    });

    if (changedKeys.length > 0) {
      await this.auditService.log({
        actor,
        action: 'SETTINGS_UPDATE',
        entity: 'Settings',
        entityId: current.id,
        details: `Campos alterados: ${changedKeys.join(', ')}`,
      });
    }

    return updated;
  }

  async applyEncargos(actor?: Actor) {
    const settings = await this.get();
    const result = computeSocialCharges({
      grupoA:
        (settings.encargosGrupoA as { nome: string; pct: number }[]) ?? [],
      grupoB:
        (settings.encargosGrupoB as { nome: string; pct: number }[]) ?? [],
      beneficios:
        (settings.encargosBeneficios as { nome: string; valorMes: number }[]) ??
        [],
      horasProdMes: Number(settings.encargosHorasProdMes),
    });

    const { count } = await this.prisma.client.laborRole.updateMany({
      data: {
        chargesPct: round2(result.encargosPct),
        beneficioHora: round2(result.beneficioHora),
      },
    });

    await this.auditService.log({
      actor,
      action: 'SOCIAL_CHARGES_APPLIED',
      entity: 'LaborRole',
      details: `Encargos ${round2(result.encargosPct)}% e beneficio R$ ${round2(result.beneficioHora)}/h aplicados a ${count} funcao(oes).`,
    });

    return { ...result, affected: count };
  }

  async exportBackup() {
    const [
      clients,
      materials,
      laborRoles,
      vehicles,
      budgets,
      workSites,
      projects,
      tools,
      stockItems,
      workLogs,
      suppliers,
      purchaseOrders,
      settings,
      financeCategories,
      financeEntries,
      projectBillingItems,
      vehicleMaintenances,
      toolMaintenances,
    ] = await Promise.all([
      this.prisma.client.client.findMany(),
      this.prisma.client.material.findMany(),
      this.prisma.client.laborRole.findMany(),
      this.prisma.client.vehicle.findMany({ include: { trips: true } }),
      this.prisma.client.budget.findMany({
        include: {
          materialItems: true,
          laborItems: true,
          travelItems: true,
          otherItems: true,
        },
      }),
      this.prisma.client.workSite.findMany(),
      this.prisma.client.project.findMany({
        include: { materialSurpluses: true, phases: true },
      }),
      this.prisma.client.tool.findMany({ include: { movements: true } }),
      this.prisma.client.stockItem.findMany({ include: { movements: true } }),
      this.prisma.client.workLog.findMany({
        include: { employees: true, vehicleUsages: true, toolsUsed: true },
      }),
      this.prisma.client.supplier.findMany(),
      this.prisma.client.purchaseOrder.findMany({ include: { items: true } }),
      this.get(),
      this.prisma.client.financeCategory.findMany(),
      this.prisma.client.financeEntry.findMany(),
      this.prisma.client.projectBillingItem.findMany(),
      this.prisma.client.vehicleMaintenance.findMany(),
      this.prisma.client.toolMaintenance.findMany(),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      settings,
      clients,
      materials,
      laborRoles,
      vehicles,
      budgets,
      workSites,
      projects,
      tools,
      stockItems,
      workLogs,
      suppliers,
      purchaseOrders,
      financeCategories,
      financeEntries,
      projectBillingItems,
      vehicleMaintenances,
      toolMaintenances,
    };
  }

  async restoreBackup(dto: RestoreBackupDto, actor?: Actor) {
    if (dto.confirmationText !== RESTORE_CONFIRMATION_PHRASE) {
      throw new BadRequestException(
        `Confirmacao invalida. Digite exatamente "${RESTORE_CONFIRMATION_PHRASE}" para prosseguir.`,
      );
    }

    const d = dto.data as Record<string, any[]>;

    await this.prisma.client.$transaction(
      async (tx) => {
        // Delete phase: exact reverse of the recreate order below.
        await tx.projectBillingItem.deleteMany();
        await tx.toolMaintenance.deleteMany();
        await tx.vehicleMaintenance.deleteMany();
        await tx.financeEntry.deleteMany();
        await tx.purchaseOrder.deleteMany();
        await tx.workLog.deleteMany();
        await tx.stockItem.deleteMany();
        await tx.tool.deleteMany();
        await tx.project.deleteMany();
        await tx.budget.deleteMany();
        await tx.vehicle.deleteMany();
        await tx.workSite.deleteMany();
        await tx.client.deleteMany();
        await tx.supplier.deleteMany();
        await tx.financeCategory.deleteMany();

        // Materials and labor roles are merged (upsert), not replaced: they
        // may be referenced by cost compositions / quotations, which are
        // outside this backup's scope and must not be broken by a restore.
        if (d.materials) {
          for (const m of d.materials) {
            await tx.material.upsert({
              where: { id: m.id },
              create: m,
              update: m,
            });
          }
        }
        if (d.laborRoles) {
          for (const lr of d.laborRoles) {
            await tx.laborRole.upsert({
              where: { id: lr.id },
              create: lr,
              update: lr,
            });
          }
        }

        // Recreate phase: parents before children. Vehicles must exist
        // before budgets (BudgetTravelItem references a vehicle), budgets
        // before projects (Project.budgetId), and projects before tools
        // (Tool.currentProjectId). Leaf rows that optionally reference a
        // project (vehicle trips, tool/stock movements) are created in a
        // later pass once every spine table above them exists.
        if (d.financeCategories)
          await tx.financeCategory.createMany({ data: d.financeCategories });
        if (d.suppliers) await tx.supplier.createMany({ data: d.suppliers });
        if (d.clients) await tx.client.createMany({ data: d.clients });
        if (d.workSites) await tx.workSite.createMany({ data: d.workSites });

        if (d.vehicles) {
          await tx.vehicle.createMany({
            data: d.vehicles.map((v) => omitKey(v, 'trips')),
          });
        }

        if (d.budgets) {
          for (const b of d.budgets) {
            const {
              materialItems,
              laborItems,
              travelItems,
              otherItems,
              compositionItems,
              ...budget
            } = b;
            await tx.budget.create({
              data: {
                ...budget,
                materialItems: {
                  create: stripFk(materialItems, 'budgetId'),
                },
                laborItems: { create: stripFk(laborItems, 'budgetId') },
                travelItems: { create: stripFk(travelItems, 'budgetId') },
                otherItems: { create: stripFk(otherItems, 'budgetId') },
                compositionItems: {
                  create: stripFk(compositionItems, 'budgetId'),
                },
              },
            });
          }
        }

        if (d.projects) {
          for (const p of d.projects) {
            const { materialSurpluses, phases, ...project } = p;
            await tx.project.create({
              data: {
                ...project,
                materialSurpluses: {
                  create: stripFk(materialSurpluses, 'projectId'),
                },
                phases: { create: stripFk(phases, 'projectId') },
              },
            });
          }
        }

        if (d.tools) {
          await tx.tool.createMany({
            data: d.tools.map((t) => omitKey(t, 'movements')),
          });
        }

        if (d.stockItems) {
          await tx.stockItem.createMany({
            data: d.stockItems.map((s) => omitKey(s, 'movements')),
          });
        }

        // Leaf pass: every table these may reference now exists. These are
        // plain top-level creates, so — unlike the nested `create` blocks
        // above — the row's own foreign key must stay intact.
        if (d.vehicles) {
          const allTrips = d.vehicles.flatMap((v) => v.trips ?? []);
          if (allTrips.length)
            await tx.vehicleTrip.createMany({ data: allTrips });
        }
        if (d.tools) {
          const allMovements = d.tools.flatMap((t) => t.movements ?? []);
          if (allMovements.length)
            await tx.toolMovement.createMany({ data: allMovements });
        }
        if (d.stockItems) {
          const allMovements = d.stockItems.flatMap((s) => s.movements ?? []);
          if (allMovements.length)
            await tx.stockMovement.createMany({ data: allMovements });
        }

        if (d.workLogs) {
          for (const w of d.workLogs) {
            const { employees, vehicleUsages, toolsUsed, ...workLog } = w;
            await tx.workLog.create({
              data: {
                ...workLog,
                employees: { create: stripFk(employees, 'workLogId') },
                vehicleUsages: {
                  create: stripFk(vehicleUsages, 'workLogId'),
                },
                toolsUsed: { create: stripFk(toolsUsed, 'workLogId') },
              },
            });
          }
        }

        if (d.purchaseOrders) {
          for (const po of d.purchaseOrders) {
            const { items, ...purchaseOrder } = po;
            await tx.purchaseOrder.create({
              data: {
                ...purchaseOrder,
                items: { create: stripFk(items, 'purchaseOrderId') },
              },
            });
          }
        }

        if (d.financeEntries)
          await tx.financeEntry.createMany({ data: d.financeEntries });
        if (d.vehicleMaintenances)
          await tx.vehicleMaintenance.createMany({
            data: d.vehicleMaintenances,
          });
        if (d.toolMaintenances)
          await tx.toolMaintenance.createMany({ data: d.toolMaintenances });
        if (d.projectBillingItems)
          await tx.projectBillingItem.createMany({
            data: d.projectBillingItems,
          });

        if (d.settings) {
          const current = await tx.settings.findFirst();
          if (current) {
            const settingsData = {
              ...(d.settings as unknown as Record<string, unknown>),
            };
            delete settingsData.id;
            await tx.settings.update({
              where: { id: current.id },
              data: settingsData,
            });
          }
        }
      },
      { timeout: 60000 },
    );

    await this.auditService.log({
      actor,
      action: 'BACKUP_RESTORE',
      entity: 'Settings',
      details: 'Restauracao de backup completa executada.',
    });

    return { restoredAt: new Date().toISOString() };
  }
}
