import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { client: true, workSite: true, budget: true };
  }

  private async generateNumber() {
    const count = await this.prisma.client.project.count();
    return 'PRJ-' + String(count + 1).padStart(4, '0');
  }

  async create(dto: CreateProjectDto) {
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const number = await this.generateNumber();
    let budgetAmount = dto.budgetAmount || 0;
    let clientId = dto.clientId;

    if (dto.budgetId) {
      const budget = await this.prisma.client.budget.findUnique({
        where: { id: dto.budgetId },
        include: {
          materialItems: true,
          laborItems: true,
          travelItems: { include: { vehicle: true } },
          otherItems: true,
        },
      });

      if (!budget) throw new NotFoundException('Orcamento nao encontrado.');

      const existingProject = await this.prisma.client.project.findUnique({
        where: { budgetId: dto.budgetId },
      });
      if (existingProject) throw new BadRequestException('Este orcamento ja possui um projeto vinculado.');

      const materialsTotal = budget.materialItems.reduce((s, i) => s + Number(i.quantity) * Number(i.unitCost), 0);
      const laborTotal = budget.laborItems.reduce((s, i) => s + Number(i.hours) * Number(i.hourlyRate), 0);
      const travelTotal = budget.travelItems.reduce((s, i) => {
        const liters = (Number(i.distanceKm) * 2 * i.trips) / Number(i.vehicle.avgConsumption);
        return s + liters * Number(i.fuelPrice);
      }, 0);
      const otherTotal = budget.otherItems.reduce((s, i) => s + Number(i.amount), 0);
      const subtotal = materialsTotal + laborTotal + travelTotal + otherTotal;
      const base = subtotal * (1 + Number(budget.bdiPct) / 100);

      budgetAmount = round2(base);
      clientId = budget.clientId;
    }

    return this.prisma.client.project.create({
      data: {
        number,
        name: dto.name,
        clientId,
        workSiteId: dto.workSiteId,
        budgetId: dto.budgetId,
        status: dto.status,
        budgetAmount,
        startDate,
        endDate,
        notes: dto.notes,
      },
      include: this.include(),
    });
  }

  findAll(search?: string) {
    return this.prisma.client.project.findMany({
      where: search
        ? {
            OR: [
              { number: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { client: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.client.project.findUnique({ where: { id }, include: this.include() });
    if (!project) throw new NotFoundException('Projeto nao encontrado.');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.client.project.update({ where: { id }, data, include: this.include() });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.project.delete({ where: { id } });
  }
}