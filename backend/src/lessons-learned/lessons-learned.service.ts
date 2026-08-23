import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, Actor } from '../audit/audit.service';
import { CreateLessonLearnedDto } from './dto/create-lesson-learned.dto';
import { UpdateLessonLearnedDto } from './dto/update-lesson-learned.dto';

@Injectable()
export class LessonsLearnedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateLessonLearnedDto, actor?: Actor) {
    const created = await this.prisma.client.lessonLearned.create({
      data: { ...dto, date: new Date(dto.date) },
    });

    await this.auditService.log({
      actor,
      action: 'LESSON_LEARNED_CREATE',
      entity: 'LessonLearned',
      entityId: created.id,
      details: created.whatHappened.slice(0, 80),
    });

    return created;
  }

  findAll() {
    return this.prisma.client.lessonLearned.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.client.lessonLearned.findUnique({
      where: { id },
    });
    if (!lesson) throw new NotFoundException('Licao aprendida nao encontrada.');
    return lesson;
  }

  async update(id: string, dto: UpdateLessonLearnedDto, actor?: Actor) {
    await this.findOne(id);
    const updated = await this.prisma.client.lessonLearned.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });

    await this.auditService.log({
      actor,
      action: 'LESSON_LEARNED_UPDATE',
      entity: 'LessonLearned',
      entityId: updated.id,
      details: updated.whatHappened.slice(0, 80),
    });

    return updated;
  }

  async remove(id: string, actor?: Actor) {
    const existing = await this.findOne(id);
    await this.prisma.client.lessonLearned.delete({ where: { id } });

    await this.auditService.log({
      actor,
      action: 'LESSON_LEARNED_DELETE',
      entity: 'LessonLearned',
      entityId: existing.id,
      details: existing.whatHappened.slice(0, 80),
    });

    return existing;
  }
}
