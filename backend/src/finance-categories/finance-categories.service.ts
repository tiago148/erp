import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinanceCategoryDto } from './dto/create-finance-category.dto';
import { UpdateFinanceCategoryDto } from './dto/update-finance-category.dto';

@Injectable()
export class FinanceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFinanceCategoryDto) {
    return this.prisma.client.financeCategory.create({ data: dto });
  }

  findAll(type?: string) {
    return this.prisma.client.financeCategory.findMany({
      where: type ? { type: type as any } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.client.financeCategory.findUnique({
      where: { id },
    });
    if (!category)
      throw new NotFoundException('Categoria financeira nao encontrada.');
    return category;
  }

  async update(id: string, dto: UpdateFinanceCategoryDto) {
    await this.findOne(id);
    return this.prisma.client.financeCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.financeCategory.delete({ where: { id } });
  }
}
