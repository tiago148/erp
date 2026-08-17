import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, Actor } from '../audit/audit.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

@Injectable()
export class ChecklistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateChecklistDto, actor?: Actor) {
    const created = await this.prisma.client.checklist.create({ data: dto });

    await this.auditService.log({
      actor,
      action: 'CHECKLIST_CREATE',
      entity: 'Checklist',
      entityId: created.id,
      details: created.title,
    });

    return created;
  }

  findAll() {
    return this.prisma.client.checklist.findMany({
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    const checklist = await this.prisma.client.checklist.findUnique({
      where: { id },
    });
    if (!checklist) throw new NotFoundException('Checklist nao encontrado.');
    return checklist;
  }

  async update(id: string, dto: UpdateChecklistDto, actor?: Actor) {
    await this.findOne(id);
    const updated = await this.prisma.client.checklist.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      actor,
      action: 'CHECKLIST_UPDATE',
      entity: 'Checklist',
      entityId: updated.id,
      details: updated.title,
    });

    return updated;
  }

  async remove(id: string, actor?: Actor) {
    const existing = await this.findOne(id);
    await this.prisma.client.checklist.delete({ where: { id } });

    await this.auditService.log({
      actor,
      action: 'CHECKLIST_DELETE',
      entity: 'Checklist',
      entityId: existing.id,
      details: existing.title,
    });

    return existing;
  }
}
