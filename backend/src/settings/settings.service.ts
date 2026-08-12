import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const existing = await this.prisma.client.settings.findFirst();
    if (existing) return existing;

    return this.prisma.client.settings.create({ data: {} });
  }

  async update(dto: UpdateSettingsDto) {
    const current = await this.get();
    return this.prisma.client.settings.update({
      where: { id: current.id },
      data: dto,
    });
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
    ] = await Promise.all([
      this.prisma.client.client.findMany(),
      this.prisma.client.material.findMany(),
      this.prisma.client.laborRole.findMany(),
      this.prisma.client.vehicle.findMany(),
      this.prisma.client.budget.findMany({
        include: {
          materialItems: true,
          laborItems: true,
          travelItems: true,
          otherItems: true,
        },
      }),
      this.prisma.client.workSite.findMany(),
      this.prisma.client.project.findMany(),
      this.prisma.client.tool.findMany({ include: { movements: true } }),
      this.prisma.client.stockItem.findMany({ include: { movements: true } }),
      this.prisma.client.workLog.findMany(),
      this.prisma.client.supplier.findMany(),
      this.prisma.client.purchaseOrder.findMany({ include: { items: true } }),
      this.get(),
      this.prisma.client.financeCategory.findMany(),
      this.prisma.client.financeEntry.findMany(),
      this.prisma.client.projectBillingItem.findMany(),
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
    };
  }
}
