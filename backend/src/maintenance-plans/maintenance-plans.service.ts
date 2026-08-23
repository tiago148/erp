import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeMaintenanceStatus } from '../common/maintenance-plan';
import {
  CreateMaintenancePlanDto,
  MaintenanceTargetType,
} from './dto/create-maintenance-plan.dto';
import { UpdateMaintenancePlanDto } from './dto/update-maintenance-plan.dto';

@Injectable()
export class MaintenancePlansService {
  constructor(private readonly prisma: PrismaService) {}

  private assertIntervalMatchesTarget(dto: {
    targetType: MaintenanceTargetType;
    intervalType: string;
    intervalKm?: number;
    intervalMonths?: number;
  }) {
    if (dto.intervalType === 'KM') {
      if ((dto.targetType as string) !== 'VEHICLE') {
        throw new BadRequestException(
          'Intervalo por quilometragem so e valido para veiculos.',
        );
      }
      if (!dto.intervalKm) {
        throw new BadRequestException('Informe o intervalo em quilometros.');
      }
    } else if (!dto.intervalMonths) {
      throw new BadRequestException('Informe o intervalo em meses.');
    }
  }

  private async getCurrentKm(
    targetType: string,
    targetId: string,
  ): Promise<number | null> {
    if (targetType !== 'VEHICLE') return null;
    const vehicle = await this.prisma.client.vehicle.findUnique({
      where: { id: targetId },
    });
    return vehicle ? Number(vehicle.currentKm) : null;
  }

  private async withStatus(plan: any) {
    const currentKm = await this.getCurrentKm(plan.targetType, plan.targetId);
    const status = computeMaintenanceStatus(
      {
        intervalType: plan.intervalType,
        intervalKm: plan.intervalKm !== null ? Number(plan.intervalKm) : null,
        intervalMonths: plan.intervalMonths,
        alertThresholdKm:
          plan.alertThresholdKm !== null ? Number(plan.alertThresholdKm) : null,
        alertThresholdDays: plan.alertThresholdDays,
        lastServiceDate: plan.lastServiceDate,
        lastServiceKm:
          plan.lastServiceKm !== null ? Number(plan.lastServiceKm) : null,
        createdAt: plan.createdAt,
      },
      currentKm,
    );
    return { ...plan, currentKm, ...status };
  }

  async create(dto: CreateMaintenancePlanDto) {
    this.assertIntervalMatchesTarget(dto);

    const plan = await this.prisma.client.maintenancePlan.create({
      data: {
        ...dto,
        lastServiceDate: dto.lastServiceDate
          ? new Date(dto.lastServiceDate)
          : undefined,
      },
    });
    return this.withStatus(plan);
  }

  async findAll(targetType?: string, targetId?: string) {
    const plans = await this.prisma.client.maintenancePlan.findMany({
      where: {
        targetType: targetType ? (targetType as any) : undefined,
        targetId: targetId || undefined,
      },
      orderBy: { name: 'asc' },
    });
    return Promise.all(plans.map((plan) => this.withStatus(plan)));
  }

  async findOne(id: string) {
    const plan = await this.prisma.client.maintenancePlan.findUnique({
      where: { id },
    });
    if (!plan) throw new NotFoundException('Plano de revisao nao encontrado.');
    return this.withStatus(plan);
  }

  async update(id: string, dto: UpdateMaintenancePlanDto) {
    const existing = await this.prisma.client.maintenancePlan.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException('Plano de revisao nao encontrado.');

    this.assertIntervalMatchesTarget({
      targetType: (dto.targetType ??
        existing.targetType) as MaintenanceTargetType,
      intervalType: dto.intervalType ?? existing.intervalType,
      intervalKm:
        dto.intervalKm ??
        (existing.intervalKm !== null
          ? Number(existing.intervalKm)
          : undefined),
      intervalMonths:
        dto.intervalMonths ?? existing.intervalMonths ?? undefined,
    });

    const plan = await this.prisma.client.maintenancePlan.update({
      where: { id },
      data: {
        ...dto,
        lastServiceDate: dto.lastServiceDate
          ? new Date(dto.lastServiceDate)
          : undefined,
      },
    });
    return this.withStatus(plan);
  }

  // Registra que a revisao foi executada agora: reseta a contagem do
  // intervalo a partir de hoje (e do km atual do veiculo, se aplicavel).
  async markServiced(id: string) {
    const existing = await this.prisma.client.maintenancePlan.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException('Plano de revisao nao encontrado.');

    const currentKm = await this.getCurrentKm(
      existing.targetType,
      existing.targetId,
    );

    const plan = await this.prisma.client.maintenancePlan.update({
      where: { id },
      data: {
        lastServiceDate: new Date(),
        lastServiceKm: currentKm ?? undefined,
      },
    });
    return this.withStatus(plan);
  }

  async remove(id: string) {
    const existing = await this.prisma.client.maintenancePlan.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException('Plano de revisao nao encontrado.');
    return this.prisma.client.maintenancePlan.delete({ where: { id } });
  }
}
