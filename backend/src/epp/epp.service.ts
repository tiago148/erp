import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEppDto } from './dto/create-epp.dto';
import { UpdateEppDto } from './dto/update-epp.dto';

@Injectable()
export class EppService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { employee: true };
  }

  create(dto: CreateEppDto) {
    return this.prisma.client.eppDelivery.create({
      data: { ...dto, deliveredAt: dto.deliveredAt ? new Date(dto.deliveredAt) : undefined },
      include: this.include(),
    });
  }

  findAll(employeeId?: string) {
    return this.prisma.client.eppDelivery.findMany({
      where: employeeId ? { employeeId } : undefined,
      include: this.include(),
      orderBy: { deliveredAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.client.eppDelivery.findUnique({ where: { id }, include: this.include() });
    if (!item) throw new NotFoundException('Registro de EPI nao encontrado.');
    return item;
  }

  async update(id: string, dto: UpdateEppDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.deliveredAt) data.deliveredAt = new Date(dto.deliveredAt);
    return this.prisma.client.eppDelivery.update({ where: { id }, data, include: this.include() });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.eppDelivery.delete({ where: { id } });
  }
}
