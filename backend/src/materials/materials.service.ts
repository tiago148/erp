import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { calculateMaterialReferencePrice } from '../common/material-price';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { BulkAdjustPriceDto } from './dto/bulk-adjust-price.dto';

function withReferencePrice(material: any) {
  const quotes = (material.quotes ?? []).map((q: any) => ({
    id: q.id,
    price: Number(q.price),
    quantity: Number(q.quantity),
    freight: Number(q.freight),
    freightModality: q.freightModality,
    validUntil: q.validUntil,
  }));
  const reference = calculateMaterialReferencePrice(
    {
      unitCost: Number(material.unitCost),
      referenceMode: material.referenceMode,
      manualQuoteId: material.manualQuoteId,
    },
    quotes,
  );
  return { ...material, reference };
}

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

    const material = await this.prisma.client.material.create({ data: dto });
    return withReferencePrice({ ...material, quotes: [] });
  }

  async findAll(search?: string) {
    const materials = await this.prisma.client.material.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { quotes: true },
      orderBy: { name: 'asc' },
    });
    return materials.map(withReferencePrice);
  }

  async findOne(id: string) {
    const material = await this.prisma.client.material.findUnique({
      where: { id },
      include: { quotes: { include: { supplier: true } } },
    });

    if (!material) {
      throw new NotFoundException('Material nao encontrado.');
    }

    return withReferencePrice(material);
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.findOne(id);
    const material = await this.prisma.client.material.update({
      where: { id },
      data: dto,
      include: { quotes: true },
    });
    return withReferencePrice(material);
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
