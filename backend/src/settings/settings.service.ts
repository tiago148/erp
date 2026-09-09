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
      ferramental:
        (settings.encargosFerramental as {
          nome: string;
          qtd: number;
          preco: number;
          vidaMeses: number;
        }[]) ?? [],
      horasProdMes: Number(settings.encargosHorasProdMes),
    });

    const { count } = await this.prisma.client.laborRole.updateMany({
      data: {
        chargesPct: round2(result.encargosPct),
        beneficioHora: round2(result.beneficioHora),
        ferramentalHora: round2(result.ferramentalHora),
      },
    });

    await this.auditService.log({
      actor,
      action: 'SOCIAL_CHARGES_APPLIED',
      entity: 'LaborRole',
      details: `Encargos ${round2(result.encargosPct)}%, beneficio R$ ${round2(result.beneficioHora)}/h e ferramental R$ ${round2(result.ferramentalHora)}/h aplicados a ${count} funcao(oes).`,
    });

    return { ...result, affected: count };
  }

  // Cobre todos os models operacionais do schema (exceto User -- credenciais
  // nao entram em backup -- e AuditLog, que e um ledger somado, nao
  // substituido, ver comentario em restoreBackup). Cada tabela nova
  // adicionada ao schema deve ganhar uma linha aqui.
  async exportBackup(actor?: Actor) {
    const [
      clients,
      materials,
      laborRoles,
      thirdPartyServices,
      rentalEquipment,
      costCompositions,
      vehicles,
      budgets,
      workSites,
      projects,
      tools,
      trackedDocuments,
      maintenancePlans,
      stockItems,
      workLogs,
      suppliers,
      purchaseOrders,
      scrapSales,
      quotations,
      settings,
      fixedExpenses,
      assets,
      priceAdjustments,
      employees,
      eppDeliveries,
      ddsRecords,
      trainings,
      tasks,
      financeAccounts,
      financeClosures,
      financeCategories,
      financeEntries,
      financeAttachments,
      projectBillingItems,
      vehicleMaintenances,
      toolMaintenances,
      calendarEvents,
      auditLogs,
      playbooks,
      checklists,
      lessonsLearned,
    ] = await Promise.all([
      this.prisma.client.client.findMany({ include: { contacts: true } }),
      this.prisma.client.material.findMany({ include: { quotes: true } }),
      this.prisma.client.laborRole.findMany(),
      this.prisma.client.thirdPartyService.findMany(),
      this.prisma.client.rentalEquipment.findMany(),
      this.prisma.client.costComposition.findMany({
        include: { materials: true, labor: true },
      }),
      this.prisma.client.vehicle.findMany({ include: { trips: true } }),
      this.prisma.client.budget.findMany({
        include: {
          materialItems: { include: { measures: true } },
          laborItems: true,
          travelItems: true,
          otherItems: true,
          compositionItems: true,
          serviceItems: true,
          rentalItems: true,
        },
      }),
      this.prisma.client.workSite.findMany(),
      this.prisma.client.project.findMany({
        include: { materialSurpluses: true, phases: true },
      }),
      this.prisma.client.tool.findMany({ include: { movements: true } }),
      this.prisma.client.trackedDocument.findMany(),
      this.prisma.client.maintenancePlan.findMany(),
      this.prisma.client.stockItem.findMany({ include: { movements: true } }),
      this.prisma.client.workLog.findMany({
        include: { employees: true, vehicleUsages: true, toolsUsed: true },
      }),
      this.prisma.client.supplier.findMany(),
      this.prisma.client.purchaseOrder.findMany({ include: { items: true } }),
      this.prisma.client.scrapSale.findMany(),
      this.prisma.client.quotation.findMany({
        include: { items: { include: { proposals: true } } },
      }),
      this.get(),
      this.prisma.client.fixedExpense.findMany(),
      this.prisma.client.asset.findMany(),
      this.prisma.client.priceAdjustment.findMany(),
      this.prisma.client.employee.findMany(),
      this.prisma.client.eppDelivery.findMany(),
      this.prisma.client.ddsRecord.findMany(),
      this.prisma.client.training.findMany(),
      this.prisma.client.task.findMany(),
      this.prisma.client.financeAccount.findMany(),
      this.prisma.client.financeClosure.findMany(),
      this.prisma.client.financeCategory.findMany(),
      this.prisma.client.financeEntry.findMany(),
      this.prisma.client.financeAttachment.findMany(),
      this.prisma.client.projectBillingItem.findMany(),
      this.prisma.client.vehicleMaintenance.findMany(),
      this.prisma.client.toolMaintenance.findMany(),
      this.prisma.client.calendarEvent.findMany(),
      this.prisma.client.auditLog.findMany(),
      this.prisma.client.playbook.findMany(),
      this.prisma.client.checklist.findMany(),
      this.prisma.client.lessonLearned.findMany(),
    ]);

    await this.auditService.log({
      actor,
      action: 'BACKUP_EXPORT',
      entity: 'Settings',
      details: 'Exportacao de backup completo gerada.',
    });

    // Cotacoes vem aninhadas em cada material (para leitura humana do JSON),
    // mas a restauracao precisa de uma lista propria no nivel raiz -- mesmo
    // padrao de todo outro item filho neste backup.
    const materialQuotes = (materials as any[]).flatMap((m) => m.quotes ?? []);

    return {
      exportedAt: new Date().toISOString(),
      settings,
      clients,
      materials,
      materialQuotes,
      laborRoles,
      thirdPartyServices,
      rentalEquipment,
      costCompositions,
      vehicles,
      budgets,
      workSites,
      projects,
      tools,
      trackedDocuments,
      maintenancePlans,
      stockItems,
      workLogs,
      suppliers,
      purchaseOrders,
      scrapSales,
      quotations,
      fixedExpenses,
      assets,
      priceAdjustments,
      employees,
      eppDeliveries,
      ddsRecords,
      trainings,
      tasks,
      financeAccounts,
      financeClosures,
      financeCategories,
      financeEntries,
      financeAttachments,
      projectBillingItems,
      vehicleMaintenances,
      toolMaintenances,
      calendarEvents,
      auditLogs,
      playbooks,
      checklists,
      lessonsLearned,
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
        // Delete phase: reverse of the recreate order below, respeitando
        // toda FK sem cascade (ex: FinanceEntry.accountId -> FinanceAccount)
        // -- a tabela que APONTA para outra precisa ser apagada primeiro.
        // AuditLog nao entra aqui de proposito: e um ledger cumulativo, nao
        // um snapshot a ser substituido -- restaurar um backup antigo nao
        // deve apagar entradas de auditoria criadas depois dele (inclusive
        // a da propria restauracao, que so e gravada ao final).
        await tx.scrapSale.deleteMany();
        await tx.projectBillingItem.deleteMany();
        await tx.toolMaintenance.deleteMany();
        await tx.vehicleMaintenance.deleteMany();
        await tx.fixedExpense.deleteMany();
        await tx.financeEntry.deleteMany();
        await tx.financeClosure.deleteMany();
        await tx.purchaseOrder.deleteMany();
        await tx.workLog.deleteMany();
        await tx.materialQuote.deleteMany();
        await tx.quotation.deleteMany();
        await tx.stockItem.deleteMany();
        await tx.tool.deleteMany();
        await tx.task.deleteMany();
        await tx.project.deleteMany();
        await tx.budget.deleteMany();
        await tx.vehicle.deleteMany();
        await tx.eppDelivery.deleteMany();
        await tx.training.deleteMany();
        await tx.employee.deleteMany();
        await tx.workSite.deleteMany();
        await tx.client.deleteMany();
        await tx.supplier.deleteMany();
        await tx.financeAccount.deleteMany();
        await tx.financeCategory.deleteMany();
        await tx.maintenancePlan.deleteMany();
        await tx.trackedDocument.deleteMany();
        await tx.calendarEvent.deleteMany();
        await tx.playbook.deleteMany();
        await tx.checklist.deleteMany();
        await tx.lessonLearned.deleteMany();
        await tx.priceAdjustment.deleteMany();
        await tx.asset.deleteMany();
        await tx.ddsRecord.deleteMany();

        // Catalogos sao mesclados (upsert), nao substituidos: um item
        // cadastrado DEPOIS do backup ter sido gerado nao pode ser perdido
        // so porque nao existia no momento do export.
        if (d.materials) {
          for (const m of d.materials) {
            await tx.material.upsert({
              where: { id: m.id },
              create: omitKey(m, 'quotes'),
              update: omitKey(m, 'quotes'),
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
        if (d.thirdPartyServices) {
          for (const s of d.thirdPartyServices) {
            await tx.thirdPartyService.upsert({
              where: { id: s.id },
              create: s,
              update: s,
            });
          }
        }
        if (d.rentalEquipment) {
          for (const r of d.rentalEquipment) {
            await tx.rentalEquipment.upsert({
              where: { id: r.id },
              create: r,
              update: r,
            });
          }
        }
        if (d.costCompositions) {
          for (const c of d.costCompositions) {
            const { materials, labor, ...composition } = c;
            await tx.costComposition.upsert({
              where: { id: composition.id },
              create: composition,
              update: composition,
            });
            // Os itens da composicao (materiais/mao de obra) sao sempre
            // substituidos por completo -- ao contrario da composicao "pai",
            // nao ha como saber quais itens sao "novos desde o backup".
            await tx.costCompositionMaterial.deleteMany({
              where: { compositionId: composition.id },
            });
            await tx.costCompositionLabor.deleteMany({
              where: { compositionId: composition.id },
            });
            if (materials?.length)
              await tx.costCompositionMaterial.createMany({
                data: stripFk(materials, 'compositionId').map((m) => ({
                  ...m,
                  compositionId: composition.id,
                })),
              });
            if (labor?.length)
              await tx.costCompositionLabor.createMany({
                data: stripFk(labor, 'compositionId').map((l) => ({
                  ...l,
                  compositionId: composition.id,
                })),
              });
          }
        }

        // Recreate phase: parents before children. Vehicles/Employees antes
        // de budgets/projects (referenciados por employeeId/driverId),
        // budgets antes de projects (Project.budgetId), catalogos de
        // servico/aluguel/composicao antes de budgets (seus itens
        // referenciam esses catalogos). Leaf rows que opcionalmente
        // referenciam um projeto (viagens, movimentacoes) sao criadas numa
        // passada posterior, quando toda a espinha dorsal ja existe.
        if (d.financeCategories)
          await tx.financeCategory.createMany({ data: d.financeCategories });
        if (d.suppliers) await tx.supplier.createMany({ data: d.suppliers });
        if (d.employees) await tx.employee.createMany({ data: d.employees });
        if (d.financeAccounts)
          await tx.financeAccount.createMany({ data: d.financeAccounts });
        if (d.maintenancePlans)
          await tx.maintenancePlan.createMany({ data: d.maintenancePlans });
        if (d.trackedDocuments)
          await tx.trackedDocument.createMany({ data: d.trackedDocuments });
        if (d.calendarEvents)
          await tx.calendarEvent.createMany({ data: d.calendarEvents });
        if (d.playbooks) await tx.playbook.createMany({ data: d.playbooks });
        if (d.checklists) await tx.checklist.createMany({ data: d.checklists });
        if (d.lessonsLearned)
          await tx.lessonLearned.createMany({ data: d.lessonsLearned });
        if (d.priceAdjustments)
          await tx.priceAdjustment.createMany({ data: d.priceAdjustments });
        if (d.assets) await tx.asset.createMany({ data: d.assets });

        if (d.clients) {
          for (const c of d.clients) {
            const { contacts, ...client } = c;
            await tx.client.create({
              data: {
                ...client,
                contacts: { create: stripFk(contacts, 'clientId') },
              },
            });
          }
        }
        if (d.workSites) await tx.workSite.createMany({ data: d.workSites });

        if (d.vehicles) {
          await tx.vehicle.createMany({
            data: d.vehicles.map((v) => omitKey(v, 'trips')),
          });
        }

        if (d.materialQuotes)
          await tx.materialQuote.createMany({ data: d.materialQuotes });

        if (d.quotations) {
          for (const q of d.quotations) {
            const { items, ...quotation } = q;
            await tx.quotation.create({
              data: {
                ...quotation,
                items: {
                  create: stripFk(items, 'quotationId').map((item: any) => {
                    const { proposals, ...quotationItem } = item;
                    return {
                      ...quotationItem,
                      proposals: {
                        create: stripFk(proposals, 'quotationItemId'),
                      },
                    };
                  }),
                },
              },
            });
          }
        }

        if (d.financeClosures)
          await tx.financeClosure.createMany({ data: d.financeClosures });

        if (d.budgets) {
          for (const b of d.budgets) {
            const {
              materialItems,
              laborItems,
              travelItems,
              otherItems,
              compositionItems,
              serviceItems,
              rentalItems,
              ...budget
            } = b;
            await tx.budget.create({
              data: {
                ...budget,
                materialItems: {
                  create: stripFk(materialItems, 'budgetId').map(
                    (item: any) => {
                      const { measures, ...rest } = item;
                      return {
                        ...rest,
                        measures: measures?.length
                          ? {
                              create: stripFk(
                                measures,
                                'budgetMaterialItemId',
                              ),
                            }
                          : undefined,
                      };
                    },
                  ),
                },
                laborItems: { create: stripFk(laborItems, 'budgetId') },
                travelItems: { create: stripFk(travelItems, 'budgetId') },
                otherItems: { create: stripFk(otherItems, 'budgetId') },
                compositionItems: {
                  create: stripFk(compositionItems, 'budgetId'),
                },
                serviceItems: { create: stripFk(serviceItems, 'budgetId') },
                rentalItems: { create: stripFk(rentalItems, 'budgetId') },
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
        if (d.tasks) await tx.task.createMany({ data: d.tasks });

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
        if (d.eppDeliveries)
          await tx.eppDelivery.createMany({ data: d.eppDeliveries });
        if (d.ddsRecords) await tx.ddsRecord.createMany({ data: d.ddsRecords });
        if (d.trainings) await tx.training.createMany({ data: d.trainings });

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
        if (d.financeAttachments)
          await tx.financeAttachment.createMany({
            data: d.financeAttachments,
          });
        if (d.vehicleMaintenances)
          await tx.vehicleMaintenance.createMany({
            data: d.vehicleMaintenances,
          });
        if (d.toolMaintenances)
          await tx.toolMaintenance.createMany({ data: d.toolMaintenances });
        if (d.fixedExpenses)
          await tx.fixedExpense.createMany({ data: d.fixedExpenses });
        if (d.scrapSales) await tx.scrapSale.createMany({ data: d.scrapSales });
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
