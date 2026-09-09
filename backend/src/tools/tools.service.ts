import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { MoveToolDto } from './dto/move-tool.dto';
import { ChargeToolDto, ReturnToolChargeDto } from './dto/tool-charge.dto';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      currentProject: true,
      responsibleEmployee: true,
      movements: {
        include: { project: true },
        orderBy: { movedAt: 'desc' as const },
      },
      charges: {
        include: { employee: true },
        orderBy: { chargedAt: 'desc' as const },
      },
    };
  }

  create(dto: CreateToolDto) {
    return this.prisma.client.tool.create({ data: dto, include: this.include() });
  }

  findAll(search?: string) {
    return this.prisma.client.tool.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: this.include(),
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tool = await this.prisma.client.tool.findUnique({ where: { id }, include: this.include() });
    if (!tool) throw new NotFoundException('Ferramenta nao encontrada.');
    return tool;
  }

  async update(id: string, dto: UpdateToolDto) {
    await this.findOne(id);
    return this.prisma.client.tool.update({ where: { id }, data: dto, include: this.include() });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.tool.delete({ where: { id } });
  }

  async move(id: string, dto: MoveToolDto) {
    const tool = await this.findOne(id);

    if (dto.toLocation === 'PROJECT' && !dto.projectId) {
      throw new BadRequestException('Informe o projeto de destino.');
    }

    if (dto.projectId) {
      const project = await this.prisma.client.project.findUnique({ where: { id: dto.projectId } });
      if (!project) throw new NotFoundException('Projeto nao encontrado.');
    }

    await this.prisma.client.toolMovement.create({
      data: {
        toolId: id,
        fromLocation: tool.currentLocation,
        toLocation: dto.toLocation,
        projectId: dto.toLocation === 'PROJECT' ? dto.projectId : null,
        responsible: dto.responsible,
        notes: dto.notes,
      },
    });

    return this.prisma.client.tool.update({
      where: { id },
      data: {
        currentLocation: dto.toLocation,
        currentProjectId: dto.toLocation === 'PROJECT' ? dto.projectId : null,
      },
      include: this.include(),
    });
  }

  // ---- Custodia individual: ficha de carga ----

  listCharges(params: { employeeId?: string; status?: string } = {}) {
    return this.prisma.client.toolCharge.findMany({
      where: {
        employeeId: params.employeeId || undefined,
        status: (params.status as any) || undefined,
      },
      include: { tool: true, employee: true },
      orderBy: { chargedAt: 'desc' },
    });
  }

  async charge(toolId: string, dto: ChargeToolDto) {
    await this.findOne(toolId);
    const employee = await this.prisma.client.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('Funcionario nao encontrado.');

    const active = await this.prisma.client.toolCharge.findFirst({
      where: { toolId, status: 'ACTIVE' },
    });

    await this.prisma.client.$transaction(async (tx) => {
      if (active) {
        await tx.toolCharge.update({
          where: { id: active.id },
          data: { status: 'TRANSFERRED', returnedAt: new Date(), returnReason: 'Transferencia' },
        });
      }
      await tx.toolCharge.create({
        data: {
          toolId,
          employeeId: dto.employeeId,
          chargedAt: dto.chargedAt ? new Date(dto.chargedAt) : new Date(),
          conditionOut: dto.conditionOut || 'Nova',
          reason: dto.reason || (active ? 'Substituicao' : 'Primeira entrega'),
          notes: dto.notes,
          status: 'ACTIVE',
        },
      });
      await tx.tool.update({
        where: { id: toolId },
        data: { custody: 'INDIVIDUAL', responsibleEmployeeId: dto.employeeId },
      });
    });

    return this.findOne(toolId);
  }

  async returnCharge(chargeId: string, dto: ReturnToolChargeDto) {
    const charge = await this.prisma.client.toolCharge.findUnique({ where: { id: chargeId } });
    if (!charge) throw new NotFoundException('Registro de carga nao encontrado.');
    if (charge.status !== 'ACTIVE') {
      throw new BadRequestException('Este item ja foi devolvido ou transferido.');
    }

    const isDismissal = (dto.returnReason || '').toLowerCase().includes('desligamento');

    await this.prisma.client.$transaction(async (tx) => {
      await tx.toolCharge.update({
        where: { id: chargeId },
        data: {
          status: 'RETURNED',
          returnedAt: dto.returnedAt ? new Date(dto.returnedAt) : new Date(),
          returnReason: dto.returnReason || 'Devolucao normal',
        },
      });
      await tx.tool.update({
        where: { id: charge.toolId },
        data: {
          responsibleEmployeeId: null,
          custody: isDismissal ? 'SHARED' : undefined,
        },
      });
    });

    return this.findOne(charge.toolId);
  }
}
