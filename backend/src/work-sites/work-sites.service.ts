import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkSiteDto } from './dto/create-work-site.dto';
import { UpdateWorkSiteDto } from './dto/update-work-site.dto';

@Injectable()
export class WorkSitesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateWorkSiteDto) {
    return this.prisma.client.workSite.create({ data: dto, include: { client: true } });
  }

  findAll(search?: string) {
    return this.prisma.client.workSite.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      include: { client: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const site = await this.prisma.client.workSite.findUnique({ where: { id }, include: { client: true } });
    if (!site) throw new NotFoundException('Local de obra nao encontrado.');
    return site;
  }

  async update(id: string, dto: UpdateWorkSiteDto) {
    await this.findOne(id);
    return this.prisma.client.workSite.update({ where: { id }, data: dto, include: { client: true } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.workSite.delete({ where: { id } });
  }
}
