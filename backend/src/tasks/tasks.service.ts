import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { project: true };
  }

  create(dto: CreateTaskDto) {
    return this.prisma.client.task.create({
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
      include: this.include(),
    });
  }

  findAll() {
    return this.prisma.client.task.findMany({ include: this.include(), orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const task = await this.prisma.client.task.findUnique({ where: { id }, include: this.include() });
    if (!task) throw new NotFoundException('Tarefa nao encontrada.');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    return this.prisma.client.task.update({ where: { id }, data, include: this.include() });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.task.delete({ where: { id } });
  }
}
