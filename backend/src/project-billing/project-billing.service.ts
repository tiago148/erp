import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOrCreateCategory } from '../common/finance';
import { CreateProjectBillingItemDto } from './dto/create-project-billing-item.dto';
import { UpdateProjectBillingItemDto } from './dto/update-project-billing-item.dto';

@Injectable()
export class ProjectBillingService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      project: true,
      financeEntry: true,
    };
  }

  async create(dto: CreateProjectBillingItemDto) {
    const project = await this.prisma.client.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) throw new NotFoundException('Projeto nao encontrado.');

    return this.prisma.client.projectBillingItem.create({
      data: {
        projectId: dto.projectId,
        description: dto.description,
        amount: dto.amount,
        plannedDate: new Date(dto.plannedDate),
        notes: dto.notes,
      },
      include: this.include(),
    });
  }

  findAll(projectId?: string) {
    return this.prisma.client.projectBillingItem.findMany({
      where: projectId ? { projectId } : undefined,
      include: this.include(),
      orderBy: { plannedDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.client.projectBillingItem.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!item)
      throw new NotFoundException('Item de faturamento nao encontrado.');
    return item;
  }

  async update(id: string, dto: UpdateProjectBillingItemDto) {
    const item = await this.findOne(id);
    if (item.status !== 'PLANNED') {
      throw new BadRequestException(
        'So e possivel editar itens ainda nao faturados.',
      );
    }

    return this.prisma.client.projectBillingItem.update({
      where: { id },
      data: {
        description: dto.description,
        amount: dto.amount,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : undefined,
        notes: dto.notes,
      },
      include: this.include(),
    });
  }

  async invoice(id: string) {
    const item = await this.findOne(id);
    if (item.status !== 'PLANNED') {
      throw new BadRequestException('Este item ja foi processado.');
    }

    const category = await getOrCreateCategory(
      this.prisma,
      'Faturamento de Projeto',
      'INCOME',
    );
    const financeEntry = await this.prisma.client.financeEntry.create({
      data: {
        type: 'INCOME',
        description: `Faturamento ${item.project.number} - ${item.description}`,
        categoryId: category.id,
        amount: item.amount,
        dueDate: item.plannedDate,
        projectId: item.projectId,
        clientId: item.project.clientId,
      },
    });

    return this.prisma.client.projectBillingItem.update({
      where: { id },
      data: { status: 'INVOICED', financeEntryId: financeEntry.id },
      include: this.include(),
    });
  }

  async cancel(id: string) {
    const item = await this.findOne(id);
    if (item.status !== 'PLANNED') {
      throw new BadRequestException(
        'So e possivel cancelar itens ainda nao faturados.',
      );
    }
    return this.prisma.client.projectBillingItem.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: this.include(),
    });
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    if (item.status !== 'PLANNED') {
      throw new BadRequestException(
        'So e possivel excluir itens ainda nao faturados.',
      );
    }
    return this.prisma.client.projectBillingItem.delete({ where: { id } });
  }
}
