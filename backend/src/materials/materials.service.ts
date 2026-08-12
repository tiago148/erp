import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { BulkAdjustPriceDto } from './dto/bulk-adjust-price.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMaterialDto) {
    if (dto.code) {
      const existing = await this.prisma.client.material.findUnique({
        where: { code: dto.code },
      });

      if (existing) {
        throw new ConflictException('Ja existe um material com este codigo.');
      }
    }

    return this.prisma.client.material.create({ data: dto });
  }

  findAll(search?: string) {
    return this.prisma.client.material.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const material = await this.prisma.client.material.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException('Material nao encontrado.');
    }

    return material;
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.findOne(id);
    return this.prisma.client.material.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.material.delete({ where: { id } });
  }

  async bulkAdjustPrice(dto: BulkAdjustPriceDto) {
    const materials = await this.prisma.client.material.findMany({
      where: dto.category ? { category: dto.category } : undefined,
    });
    if (materials.length === 0) return { adjusted: 0 };

    await this.prisma.client.$transaction(
      materials.map((m) =>
        this.prisma.client.material.update({
          where: { id: m.id },
          data: {
            unitCost: round2(Number(m.unitCost) * (1 + dto.percentage / 100)),
          },
        }),
      ),
    );

    return { adjusted: materials.length };
  }
}
