import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { CreateRentalEquipmentDto } from './dto/create-rental-equipment.dto';
import { UpdateRentalEquipmentDto } from './dto/update-rental-equipment.dto';
import { BulkAdjustPriceDto } from './dto/bulk-adjust-price.dto';

@Injectable()
export class RentalEquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRentalEquipmentDto) {
    return this.prisma.client.rentalEquipment.create({ data: dto });
  }

  async findAll(search?: string) {
    return this.prisma.client.rentalEquipment.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const equipment = await this.prisma.client.rentalEquipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException('Equipamento de aluguel nao encontrado.');
    }

    return equipment;
  }

  async update(id: string, dto: UpdateRentalEquipmentDto) {
    await this.findOne(id);
    return this.prisma.client.rentalEquipment.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const inUse = await this.prisma.client.budgetRentalItem.findFirst({
      where: { rentalEquipmentId: id },
    });
    if (inUse) {
      throw new ConflictException(
        'Nao e possivel excluir: equipamento ja utilizado em orcamento(s).',
      );
    }
    return this.prisma.client.rentalEquipment.delete({ where: { id } });
  }

  async bulkAdjustPrice(dto: BulkAdjustPriceDto) {
    const equipment = await this.prisma.client.rentalEquipment.findMany({
      where: dto.category ? { category: dto.category } : undefined,
    });
    if (equipment.length === 0) return { adjusted: 0 };

    await this.prisma.client.$transaction(
      equipment.map((e) =>
        this.prisma.client.rentalEquipment.update({
          where: { id: e.id },
          data: {
            unitPrice: round2(Number(e.unitPrice) * (1 + dto.percentage / 100)),
          },
        }),
      ),
    );

    return { adjusted: equipment.length };
  }
}
