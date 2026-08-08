import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      supplier: true,
      items: { include: { material: true } },
    };
  }

  private async generateNumber() {
    const count = await this.prisma.client.purchaseOrder.count();
    return 'PC-' + String(count + 1).padStart(4, '0');
  }

  async create(dto: CreatePurchaseOrderDto) {
    const number = await this.generateNumber();

    return this.prisma.client.purchaseOrder.create({
      data: {
        number,
        supplierId: dto.supplierId,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        },
      },
      include: this.include(),
    });
  }

  findAll(search?: string) {
    return this.prisma.client.purchaseOrder.findMany({
      where: search
        ? {
            OR: [
              { number: { contains: search, mode: 'insensitive' } },
              { supplier: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.client.purchaseOrder.findUnique({ where: { id }, include: this.include() });
    if (!order) throw new NotFoundException('Pedido de compra nao encontrado.');
    return order;
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    const order = await this.findOne(id);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('So e possivel editar pedidos pendentes.');
    }

    const updateData: any = { supplierId: dto.supplierId, notes: dto.notes };

    if (dto.items) {
      await this.prisma.client.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      updateData.items = {
        create: dto.items.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      };
    }

    return this.prisma.client.purchaseOrder.update({ where: { id }, data: updateData, include: this.include() });
  }

  async receive(id: string) {
    const order = await this.findOne(id);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Este pedido ja foi processado.');
    }

    for (const item of order.items) {
      const stockItem = await this.prisma.client.stockItem.findUnique({ where: { materialId: item.materialId } });
      const receiptNote = 'Recebimento do pedido ' + order.number;

      if (stockItem) {
        await this.prisma.client.stockItem.update({
          where: { id: stockItem.id },
          data: { quantity: Number(stockItem.quantity) + Number(item.quantity) },
        });
        await this.prisma.client.stockMovement.create({
          data: {
            stockItemId: stockItem.id,
            type: 'IN',
            quantity: item.quantity,
            notes: receiptNote,
          },
        });
      } else {
        const newStockItem = await this.prisma.client.stockItem.create({
          data: { materialId: item.materialId, quantity: item.quantity, minQuantity: 0 },
        });
        await this.prisma.client.stockMovement.create({
          data: {
            stockItemId: newStockItem.id,
            type: 'IN',
            quantity: item.quantity,
            notes: receiptNote,
          },
        });
      }
    }

    return this.prisma.client.purchaseOrder.update({
      where: { id },
      data: { status: 'RECEIVED', receivedAt: new Date() },
      include: this.include(),
    });
  }

  async cancel(id: string) {
    const order = await this.findOne(id);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Este pedido ja foi processado.');
    }
    return this.prisma.client.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' }, include: this.include() });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.purchaseOrder.delete({ where: { id } });
  }
}