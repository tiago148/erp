import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { getOrCreateCategory } from '../common/finance';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      supplier: true,
      destinationProject: true,
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
        requestedBy: dto.requestedBy,
        destinationProjectId: dto.destinationProjectId,
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
    const order = await this.prisma.client.purchaseOrder.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!order) throw new NotFoundException('Pedido de compra nao encontrado.');
    return order;
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    const order = await this.findOne(id);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('So e possivel editar pedidos pendentes.');
    }

    const updateData: any = {
      supplierId: dto.supplierId,
      notes: dto.notes,
      requestedBy: dto.requestedBy,
      destinationProjectId: dto.destinationProjectId,
    };

    if (dto.items) {
      await this.prisma.client.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      });
      updateData.items = {
        create: dto.items.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      };
    }

    return this.prisma.client.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: this.include(),
    });
  }

  async receive(id: string) {
    const order = await this.findOne(id);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Este pedido ja foi processado.');
    }

    for (const item of order.items) {
      let stockItem = await this.prisma.client.stockItem.findUnique({
        where: { materialId: item.materialId },
      });
      if (!stockItem) {
        stockItem = await this.prisma.client.stockItem.create({
          data: { materialId: item.materialId, quantity: 0, minQuantity: 0 },
        });
      }

      await this.prisma.client.stockMovement.create({
        data: {
          stockItemId: stockItem.id,
          type: 'IN',
          quantity: item.quantity,
          notes: 'Recebimento do pedido ' + order.number,
        },
      });

      let newQuantity = Number(stockItem.quantity) + Number(item.quantity);

      if (order.destinationProjectId) {
        await this.prisma.client.stockMovement.create({
          data: {
            stockItemId: stockItem.id,
            type: 'OUT',
            quantity: item.quantity,
            projectId: order.destinationProjectId,
            notes: `Direcionado ao projeto ${order.destinationProject?.name} - pedido ${order.number}`,
          },
        });
        newQuantity -= Number(item.quantity);
      }

      await this.prisma.client.stockItem.update({
        where: { id: stockItem.id },
        data: { quantity: newQuantity },
      });
    }

    const amount = round2(
      order.items.reduce(
        (s, i) => s + Number(i.quantity) * Number(i.unitCost),
        0,
      ),
    );
    const category = await getOrCreateCategory(
      this.prisma,
      'Compras',
      'EXPENSE',
    );
    await this.prisma.client.financeEntry.create({
      data: {
        type: 'EXPENSE',
        description: `Pedido de compra ${order.number} - ${order.supplier.name}`,
        categoryId: category.id,
        amount,
        dueDate: new Date(),
        supplierId: order.supplierId,
        purchaseOrderId: order.id,
      },
    });

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
    return this.prisma.client.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: this.include(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.purchaseOrder.delete({ where: { id } });
  }
}
