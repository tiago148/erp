import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { MoveToolDto } from './dto/move-tool.dto';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      currentProject: true,
      movements: {
        include: { project: true },
        orderBy: { movedAt: 'desc' as const },
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
}
