import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDdsDto } from './dto/create-dds.dto';
import { UpdateDdsDto } from './dto/update-dds.dto';

@Injectable()
export class DdsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDdsDto) {
    return this.prisma.client.ddsRecord.create({
      data: { ...dto, date: new Date(dto.date), participants: dto.participants || [] },
    });
  }

  findAll() {
    return this.prisma.client.ddsRecord.findMany({ orderBy: { date: 'desc' } });
  }

  async findOne(id: string) {
    const record = await this.prisma.client.ddsRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Registro de DDS nao encontrado.');
    return record;
  }

  async update(id: string, dto: UpdateDdsDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);
    return this.prisma.client.ddsRecord.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.ddsRecord.delete({ where: { id } });
  }
}
