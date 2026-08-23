import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectPhaseDto } from './dto/create-project-phase.dto';
import { UpdateProjectPhaseDto } from './dto/update-project-phase.dto';

@Injectable()
export class ProjectPhasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectPhaseDto) {
    const project = await this.prisma.client.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) throw new NotFoundException('Projeto nao encontrado.');

    return this.prisma.client.projectPhase.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        weightPct: dto.weightPct,
        plannedStart: new Date(dto.plannedStart),
        plannedEnd: new Date(dto.plannedEnd),
        progressPct: dto.progressPct ?? 0,
        measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : undefined,
        notes: dto.notes,
      },
    });
  }

  findAll(projectId?: string) {
    return this.prisma.client.projectPhase.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { plannedStart: 'asc' },
    });
  }

  async findOne(id: string) {
    const phase = await this.prisma.client.projectPhase.findUnique({
      where: { id },
    });
    if (!phase) throw new NotFoundException('Etapa nao encontrada.');
    return phase;
  }

  async update(id: string, dto: UpdateProjectPhaseDto) {
    await this.findOne(id);
    return this.prisma.client.projectPhase.update({
      where: { id },
      data: {
        name: dto.name,
        weightPct: dto.weightPct,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
        progressPct: dto.progressPct,
        measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : undefined,
        notes: dto.notes,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.projectPhase.delete({ where: { id } });
  }
}
