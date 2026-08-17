import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, Actor } from '../audit/audit.service';
import { CreatePlaybookDto } from './dto/create-playbook.dto';
import { UpdatePlaybookDto } from './dto/update-playbook.dto';

@Injectable()
export class PlaybooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePlaybookDto, actor?: Actor) {
    const created = await this.prisma.client.playbook.create({
      data: { ...dto, version: 1 },
    });

    await this.auditService.log({
      actor,
      action: 'PLAYBOOK_CREATE',
      entity: 'Playbook',
      entityId: created.id,
      details: created.title,
    });

    return created;
  }

  findAll() {
    return this.prisma.client.playbook.findMany({
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    const playbook = await this.prisma.client.playbook.findUnique({
      where: { id },
    });
    if (!playbook) throw new NotFoundException('Procedimento nao encontrado.');
    return playbook;
  }

  async update(id: string, dto: UpdatePlaybookDto, actor?: Actor) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.client.playbook.update({
      where: { id },
      data: { ...dto, version: existing.version + 1 },
    });

    await this.auditService.log({
      actor,
      action: 'PLAYBOOK_UPDATE',
      entity: 'Playbook',
      entityId: updated.id,
      details: `${updated.title} v${updated.version}`,
    });

    return updated;
  }

  async remove(id: string, actor?: Actor) {
    const existing = await this.findOne(id);
    await this.prisma.client.playbook.delete({ where: { id } });

    await this.auditService.log({
      actor,
      action: 'PLAYBOOK_DELETE',
      entity: 'Playbook',
      entityId: existing.id,
      details: existing.title,
    });

    return existing;
  }
}
