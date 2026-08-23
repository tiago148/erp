import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

@Injectable()
export class TrainingsService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { employee: true };
  }

  create(dto: CreateTrainingDto) {
    return this.prisma.client.training.create({
      data: {
        ...dto,
        completedAt: new Date(dto.completedAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: this.include(),
    });
  }

  findAll(employeeId?: string) {
    return this.prisma.client.training.findMany({
      where: employeeId ? { employeeId } : undefined,
      include: this.include(),
      orderBy: { expiresAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const training = await this.prisma.client.training.findUnique({ where: { id }, include: this.include() });
    if (!training) throw new NotFoundException('Treinamento nao encontrado.');
    return training;
  }

  async update(id: string, dto: UpdateTrainingDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.completedAt) data.completedAt = new Date(dto.completedAt);
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);
    return this.prisma.client.training.update({ where: { id }, data, include: this.include() });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.training.delete({ where: { id } });
  }
}
