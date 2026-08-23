import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { getOrCreateCategory } from '../common/finance';
import { AuditService, Actor } from '../audit/audit.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

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

  async create(dto: CreatePurchaseOrderDto, actor?: Actor) {
    const number = await this.generateNumber();

    const order = await this.prisma.client.purchaseOrder.create({
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

    await this.auditService.log({
      actor,
      action: 'PURCHASE_ORDER_CREATE',
      entity: 'PurchaseOrder',
      entityId: order.id,
      details: `Nº ${order.number}: ${order.items.length} item(ns), fornecedor ${order.supplier.name}`,
    });

    return order;
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

  async update(id: string, dto: UpdatePurchaseOrderDto, actor?: Actor) {
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
      updateData.items = {
        create: dto.items.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      };
    }

    // deleteMany + update precisam ser atomicos: se o update falhar depois
    // do deleteMany (ex: material invalido num item novo), os itens antigos
    // ja teriam sido apagados sem substituto.
    const updated = await this.prisma.client.$transaction(async (tx) => {
      if (dto.items) {
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: this.include(),
      });
    });

    await this.auditService.log({
      actor,
      action: 'PURCHASE_ORDER_UPDATE',
      entity: 'PurchaseOrder',
      entityId: updated.id,
      details: `Nº ${updated.number}`,
    });

    return updated;
  }

  async receive(id: string, actor?: Actor) {
    const order = await this.findOne(id);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Este pedido ja foi processado.');
    }

    const amount = round2(
      order.items.reduce(
        (s, i) => s + Number(i.quantity) * Number(i.unitCost),
        0,
      ),
    );
    // Resolvida fora da transacao: getOrCreateCategory pode fazer um
    // findFirst+create isolado e a categoria "Compras" ja existir ou nao
    // faz diferenca nenhuma se rodar antes ou dentro do receive.
    const category = await getOrCreateCategory(
      this.prisma,
      'Compras',
      'EXPENSE',
    );

    // Estoque + financeiro + status do pedido inteiros numa unica
    // transacao: uma falha no meio (ex: no ultimo item) nao pode deixar
    // parte do estoque atualizado e o pedido ainda PENDING, ou vice-versa.
    const updated = await this.prisma.client.$transaction(async (tx) => {
      for (const item of order.items) {
        let stockItem = await tx.stockItem.findUnique({
          where: { materialId: item.materialId },
        });
        if (!stockItem) {
          stockItem = await tx.stockItem.create({
            data: { materialId: item.materialId, quantity: 0, minQuantity: 0 },
          });
        }

        await tx.stockMovement.create({
          data: {
            stockItemId: stockItem.id,
            type: 'IN',
            quantity: item.quantity,
            source: 'PURCHASE_ORDER',
            notes: 'Recebimento do pedido ' + order.number,
          },
        });

        let newQuantity = Number(stockItem.quantity) + Number(item.quantity);

        if (order.destinationProjectId) {
          await tx.stockMovement.create({
            data: {
              stockItemId: stockItem.id,
              type: 'OUT',
              quantity: item.quantity,
              projectId: order.destinationProjectId,
              source: 'PURCHASE_ORDER',
              notes: `Direcionado ao projeto ${order.destinationProject?.name} - pedido ${order.number}`,
            },
          });
          newQuantity -= Number(item.quantity);
        }

        await tx.stockItem.update({
          where: { id: stockItem.id },
          data: { quantity: newQuantity },
        });
      }

      await tx.financeEntry.create({
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

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED', receivedAt: new Date() },
        include: this.include(),
      });
    });

    await this.auditService.log({
      actor,
      action: 'PURCHASE_ORDER_RECEIVED',
      entity: 'PurchaseOrder',
      entityId: updated.id,
      details: `Nº ${updated.number}: estoque atualizado, lançamento de ${amount.toFixed(2)} gerado${order.destinationProjectId ? `, direcionado ao projeto ${order.destinationProject?.name}` : ''}`,
    });

    return updated;
  }

  async cancel(id: string, actor?: Actor) {
    const order = await this.findOne(id);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Este pedido ja foi processado.');
    }
    const updated = await this.prisma.client.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: this.include(),
    });

    await this.auditService.log({
      actor,
      action: 'PURCHASE_ORDER_CANCELLED',
      entity: 'PurchaseOrder',
      entityId: updated.id,
      details: `Nº ${updated.number}`,
    });

    return updated;
  }

  async remove(id: string, actor?: Actor) {
    const order = await this.findOne(id);
    const deleted = await this.prisma.client.purchaseOrder.delete({
      where: { id },
    });

    await this.auditService.log({
      actor,
      action: 'PURCHASE_ORDER_DELETE',
      entity: 'PurchaseOrder',
      entityId: id,
      details: `Nº ${order.number}`,
    });

    return deleted;
  }
}
