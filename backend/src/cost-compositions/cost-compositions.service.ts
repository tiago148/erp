import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { calculateCompositionUnitCost } from '../common/cost-composition';
import { CreateCostCompositionDto } from './dto/create-cost-composition.dto';
import { UpdateCostCompositionDto } from './dto/update-cost-composition.dto';

@Injectable()
export class CostCompositionsService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      materials: { include: { material: true } },
      labor: { include: { laborRole: true } },
    };
  }

  private attachCost(composition: any) {
    const costs = calculateCompositionUnitCost(composition);
    return {
      ...composition,
      costs: {
        materialCost: round2(costs.materialCost),
        laborCost: round2(costs.laborCost),
        unitCost: round2(costs.unitCost),
        totalHours: round2(costs.totalHours),
      },
    };
  }

  async create(dto: CreateCostCompositionDto) {
    const materialsData = await Promise.all(
      (dto.materials || []).map(async (item) => {
        const material = await this.prisma.client.material.findUnique({
          where: { id: item.materialId },
        });
        if (!material)
          throw new NotFoundException(
            'Material nao encontrado: ' + item.materialId,
          );
        return { materialId: item.materialId, coefficient: item.coefficient };
      }),
    );

    const laborData = await Promise.all(
      (dto.labor || []).map(async (item) => {
        const role = await this.prisma.client.laborRole.findUnique({
          where: { id: item.laborRoleId },
        });
        if (!role)
          throw new NotFoundException(
            'Funcao nao encontrada: ' + item.laborRoleId,
          );
        return {
          laborRoleId: item.laborRoleId,
          hoursPerUnit: item.hoursPerUnit,
        };
      }),
    );

    const composition = await this.prisma.client.costComposition.create({
      data: {
        code: dto.code,
        name: dto.name,
        unit: dto.unit,
        description: dto.description,
        materials: { create: materialsData },
        labor: { create: laborData },
      },
      include: this.include(),
    });

    return this.attachCost(composition);
  }

  async findAll() {
    const compositions = await this.prisma.client.costComposition.findMany({
      include: this.include(),
      orderBy: { name: 'asc' },
    });
    return compositions.map((c) => this.attachCost(c));
  }

  async findOne(id: string) {
    const composition = await this.prisma.client.costComposition.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!composition)
      throw new NotFoundException('Composicao nao encontrada.');
    return this.attachCost(composition);
  }

  async update(id: string, dto: UpdateCostCompositionDto) {
    await this.findOne(id);

    const updateData: any = {
      code: dto.code,
      name: dto.name,
      unit: dto.unit,
      description: dto.description,
    };

    if (dto.materials) {
      const materialsData = await Promise.all(
        dto.materials.map(async (item) => {
          const material = await this.prisma.client.material.findUnique({
            where: { id: item.materialId },
          });
          if (!material)
            throw new NotFoundException(
              'Material nao encontrado: ' + item.materialId,
            );
          return {
            materialId: item.materialId,
            coefficient: item.coefficient,
          };
        }),
      );
      await this.prisma.client.costCompositionMaterial.deleteMany({
        where: { compositionId: id },
      });
      updateData.materials = { create: materialsData };
    }

    if (dto.labor) {
      const laborData = await Promise.all(
        dto.labor.map(async (item) => {
          const role = await this.prisma.client.laborRole.findUnique({
            where: { id: item.laborRoleId },
          });
          if (!role)
            throw new NotFoundException(
              'Funcao nao encontrada: ' + item.laborRoleId,
            );
          return {
            laborRoleId: item.laborRoleId,
            hoursPerUnit: item.hoursPerUnit,
          };
        }),
      );
      await this.prisma.client.costCompositionLabor.deleteMany({
        where: { compositionId: id },
      });
      updateData.labor = { create: laborData };
    }

    const composition = await this.prisma.client.costComposition.update({
      where: { id },
      data: updateData,
      include: this.include(),
    });

    return this.attachCost(composition);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.costComposition.delete({ where: { id } });
  }
}
