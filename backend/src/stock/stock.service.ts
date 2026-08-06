import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      material: true,
      movements: { include: { project: true }, orderBy: { movedAt: 'desc' as const } },
    };
  }

  async create(dto: CreateStockItemDto) {
    const existing = await this.prisma.client.stockItem.findUnique({ where: { materialId: dto.materialId } });
    if (existing) throw new ConflictException('Este material ja possui um item de estoque.');

    return this.prisma.client.stockItem.create({ data: dto, include: this.include() });
  }

  findAll(search?: string) {
    return this.prisma.client.stockItem.findMany({
      where: search
        ? { material: { name: { contains: search, mode: 'insensitive' } } }
        : undefined,
      include: this.include(),
      orderBy: { material: { name: 'asc' } },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.client.stockItem.findUnique({ where: { id }, include: this.include() });
    if (!item) throw new NotFoundException('Item de estoque nao encontrado.');
    return item;
  }

  async update(id: string, dto: UpdateStockItemDto) {
    await this.findOne(id);
    return this.prisma.client.stockItem.update({ where: { id }, data: dto, include: this.include() });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.stockItem.delete({ where: { id } });
  }

  async addMovement(stockItemId: string, dto: CreateStockMovementDto) {
    const item = await this.findOne(stockItemId);

    if (dto.type === 'OUT' && Number(item.quantity) < dto.quantity) {
      throw new BadRequestException('Quantidade insuficiente em estoque.');
    }

    await this.prisma.client.stockMovement.create({
      data: {
        stockItemId,
        type: dto.type,
        quantity: dto.quantity,
        projectId: dto.projectId,
        notes: dto.notes,
      },
    });

    const newQuantity =
      dto.type === 'IN' ? Number(item.quantity) + dto.quantity : Number(item.quantity) - dto.quantity;

    return this.prisma.client.stockItem.update({
      where: { id: stockItemId },
      data: { quantity: newQuantity },
      include: this.include(),
    });
  }
}
