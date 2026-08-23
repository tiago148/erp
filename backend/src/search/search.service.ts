import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string) {
    if (!query || query.trim().length < 2) {
      return {
        clients: [],
        materials: [],
        employees: [],
        projects: [],
        budgets: [],
        tools: [],
        suppliers: [],
        vehicles: [],
        purchaseOrders: [],
        quotations: [],
        tasks: [],
        workSites: [],
        financeEntries: [],
      };
    }

    const q = query.trim();
    const contains = { contains: q, mode: 'insensitive' as const };

    const [
      clients,
      materials,
      employees,
      projects,
      budgets,
      tools,
      suppliers,
      vehicles,
      purchaseOrders,
      quotations,
      tasks,
      workSites,
      financeEntries,
    ] = await Promise.all([
      this.prisma.client.client.findMany({
        where: { OR: [{ name: contains }, { document: contains }] },
        take: 5,
      }),
      this.prisma.client.material.findMany({
        where: { OR: [{ name: contains }, { code: contains }] },
        take: 5,
      }),
      this.prisma.client.employee.findMany({
        where: { OR: [{ name: contains }, { role: contains }] },
        take: 5,
      }),
      this.prisma.client.project.findMany({
        where: { OR: [{ name: contains }, { number: contains }] },
        include: { client: true },
        take: 5,
      }),
      this.prisma.client.budget.findMany({
        where: { OR: [{ number: contains }] },
        include: { client: true },
        take: 5,
      }),
      this.prisma.client.tool.findMany({
        where: { OR: [{ name: contains }, { code: contains }] },
        take: 5,
      }),
      this.prisma.client.supplier.findMany({
        where: { OR: [{ name: contains }, { document: contains }] },
        take: 5,
      }),
      this.prisma.client.vehicle.findMany({
        where: { OR: [{ name: contains }, { plate: contains }] },
        take: 5,
      }),
      this.prisma.client.purchaseOrder.findMany({
        where: { OR: [{ number: contains }] },
        include: { supplier: true },
        take: 5,
      }),
      this.prisma.client.quotation.findMany({
        where: { OR: [{ number: contains }, { description: contains }] },
        take: 5,
      }),
      this.prisma.client.task.findMany({
        where: { OR: [{ title: contains }] },
        take: 5,
      }),
      this.prisma.client.workSite.findMany({
        where: { OR: [{ name: contains }, { address: contains }] },
        include: { client: true },
        take: 5,
      }),
      this.prisma.client.financeEntry.findMany({
        where: { OR: [{ description: contains }] },
        take: 5,
      }),
    ]);

    return {
      clients,
      materials,
      employees,
      projects,
      budgets,
      tools,
      suppliers,
      vehicles,
      purchaseOrders,
      quotations,
      tasks,
      workSites,
      financeEntries,
    };
  }
}
