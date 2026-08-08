import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';

@Injectable()
export class WorkLogsService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { project: true };
  }

  create(dto: CreateWorkLogDto) {
    return this.prisma.client.workLog.create({
      data: { ...dto, date: new Date(dto.date) },
      include: this.include(),
    });
  }

  findAll(projectId?: string) {
    return this.prisma.client.workLog.findMany({
      where: projectId ? { projectId } : undefined,
      include: this.include(),
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.client.workLog.findUnique({ where: { id }, include: this.include() });
    if (!log) throw new NotFoundException('Registro de diario nao encontrado.');
    return log;
  }

  async update(id: string, dto: UpdateWorkLogDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);
    return this.prisma.client.workLog.update({ where: { id }, data, include: this.include() });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.workLog.delete({ where: { id } });
  }
}
