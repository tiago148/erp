import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialSurplusDto } from './dto/create-material-surplus.dto';

interface FindAllQuery {
  projectId?: string;
  status?: string;
}

@Injectable()
export class MaterialSurplusService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { project: true, material: true };
  }

  async create(dto: CreateMaterialSurplusDto) {
    const [project, material] = await Promise.all([
      this.prisma.client.project.findUnique({ where: { id: dto.projectId } }),
      this.prisma.client.material.findUnique({ where: { id: dto.materialId } }),
    ]);
    if (!project) throw new NotFoundException('Projeto nao encontrado.');
    if (!material) throw new NotFoundException('Material nao encontrado.');

    return this.prisma.client.materialSurplus.create({
      data: {
        projectId: dto.projectId,
        materialId: dto.materialId,
        quantity: dto.quantity,
        notes: dto.notes,
      },
      include: this.include(),
    });
  }

  findAll(query: FindAllQuery = {}) {
    return this.prisma.client.materialSurplus.findMany({
      where: {
        projectId: query.projectId || undefined,
        status: (query.status as any) || undefined,
      },
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const surplus = await this.prisma.client.materialSurplus.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!surplus) throw new NotFoundException('Sobra nao encontrada.');
    return surplus;
  }

  async returnToStock(id: string) {
    const surplus = await this.findOne(id);
    if (surplus.status !== 'PENDING') {
      throw new BadRequestException('Esta sobra ja foi resolvida.');
    }

    let stockItem = await this.prisma.client.stockItem.findUnique({
      where: { materialId: surplus.materialId },
    });
    if (!stockItem) {
      stockItem = await this.prisma.client.stockItem.create({
        data: { materialId: surplus.materialId, quantity: 0, minQuantity: 0 },
      });
    }

    await this.prisma.client.stockMovement.create({
      data: {
        stockItemId: stockItem.id,
        type: 'IN',
        quantity: surplus.quantity,
        projectId: surplus.projectId,
        notes: `Sobra devolvida do projeto ${surplus.project.name}`,
      },
    });
    await this.prisma.client.stockItem.update({
      where: { id: stockItem.id },
      data: { quantity: Number(stockItem.quantity) + Number(surplus.quantity) },
    });

    return this.prisma.client.materialSurplus.update({
      where: { id },
      data: { status: 'RETURNED_TO_STOCK', resolvedAt: new Date() },
      include: this.include(),
    });
  }

  async keepAtProject(id: string) {
    const surplus = await this.findOne(id);
    if (surplus.status !== 'PENDING') {
      throw new BadRequestException('Esta sobra ja foi resolvida.');
    }

    return this.prisma.client.materialSurplus.update({
      where: { id },
      data: { status: 'KEPT_AT_PROJECT', resolvedAt: new Date() },
      include: this.include(),
    });
  }

  async remove(id: string) {
    const surplus = await this.findOne(id);
    if (surplus.status !== 'PENDING') {
      throw new BadRequestException(
        'So e possivel excluir sobras ainda nao resolvidas.',
      );
    }
    return this.prisma.client.materialSurplus.delete({ where: { id } });
  }
}
