import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOrCreateCategory } from '../common/finance';
import { CreateToolMaintenanceDto } from './dto/create-tool-maintenance.dto';
import { UpdateToolMaintenanceDto } from './dto/update-tool-maintenance.dto';

@Injectable()
export class ToolMaintenancesService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { tool: true, financeEntry: true };
  }

  async create(dto: CreateToolMaintenanceDto) {
    const tool = await this.prisma.client.tool.findUnique({
      where: { id: dto.toolId },
    });
    if (!tool) throw new NotFoundException('Ferramenta nao encontrada.');

    let financeEntryId: string | undefined;
    if (dto.cost > 0) {
      const category = await getOrCreateCategory(
        this.prisma,
        'Manutencao de Ferramentas',
        'EXPENSE',
      );
      const financeEntry = await this.prisma.client.financeEntry.create({
        data: {
          type: 'EXPENSE',
          description: `Manutencao (${dto.type}) - ${tool.name}`,
          categoryId: category.id,
          amount: dto.cost,
          dueDate: new Date(dto.date),
          toolId: dto.toolId,
        },
      });
      financeEntryId = financeEntry.id;
    }

    return this.prisma.client.toolMaintenance.create({
      data: {
        toolId: dto.toolId,
        date: new Date(dto.date),
        type: dto.type,
        cost: dto.cost,
        description: dto.description,
        supplierName: dto.supplierName,
        financeEntryId,
      },
      include: this.include(),
    });
  }

  findAll(toolId?: string) {
    return this.prisma.client.toolMaintenance.findMany({
      where: toolId ? { toolId } : undefined,
      include: this.include(),
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const maintenance = await this.prisma.client.toolMaintenance.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!maintenance) throw new NotFoundException('Manutencao nao encontrada.');
    return maintenance;
  }

  async update(id: string, dto: UpdateToolMaintenanceDto) {
    await this.findOne(id);
    return this.prisma.client.toolMaintenance.update({
      where: { id },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        type: dto.type,
        cost: dto.cost,
        description: dto.description,
        supplierName: dto.supplierName,
      },
      include: this.include(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.toolMaintenance.delete({ where: { id } });
  }
}
