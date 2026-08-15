import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { calculateLaborRoleEffectiveRate } from '../common/labor-rate';
import { CreateLaborRoleDto } from './dto/create-labor-role.dto';
import { UpdateLaborRoleDto } from './dto/update-labor-role.dto';
import { BulkAdjustPriceDto } from './dto/bulk-adjust-price.dto';

function withEffectiveRate(role: any, salarioMinimo: number) {
  const { effectiveHourlyRate } = calculateLaborRoleEffectiveRate(
    {
      hourlyRate: Number(role.hourlyRate),
      chargesPct: Number(role.chargesPct),
      periculosidade: role.periculosidade,
      insalubridadePct: Number(role.insalubridadePct),
      noturnoPct: Number(role.noturnoPct),
    },
    salarioMinimo,
  );

  return { ...role, effectiveHourlyRate: round2(effectiveHourlyRate) };
}

@Injectable()
export class LaborRolesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSalarioMinimo() {
    const settings = await this.prisma.client.settings.findFirst();
    return settings ? Number(settings.salarioMinimo) : 1518;
  }

  async create(dto: CreateLaborRoleDto) {
    const existing = await this.prisma.client.laborRole.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Ja existe uma funcao com este nome.');
    }

    const role = await this.prisma.client.laborRole.create({ data: dto });
    return withEffectiveRate(role, await this.getSalarioMinimo());
  }

  async findAll(search?: string) {
    const [roles, salarioMinimo] = await Promise.all([
      this.prisma.client.laborRole.findMany({
        where: search
          ? { name: { contains: search, mode: 'insensitive' } }
          : undefined,
        orderBy: { name: 'asc' },
      }),
      this.getSalarioMinimo(),
    ]);

    return roles.map((role) => withEffectiveRate(role, salarioMinimo));
  }

  async findOne(id: string) {
    const [role, salarioMinimo] = await Promise.all([
      this.prisma.client.laborRole.findUnique({ where: { id } }),
      this.getSalarioMinimo(),
    ]);

    if (!role) {
      throw new NotFoundException('Funcao nao encontrada.');
    }

    return withEffectiveRate(role, salarioMinimo);
  }

  async update(id: string, dto: UpdateLaborRoleDto) {
    await this.findOne(id);
    const role = await this.prisma.client.laborRole.update({
      where: { id },
      data: dto,
    });
    return withEffectiveRate(role, await this.getSalarioMinimo());
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.laborRole.delete({ where: { id } });
  }

  async bulkAdjustPrice(dto: BulkAdjustPriceDto) {
    const roles = await this.prisma.client.laborRole.findMany();
    if (roles.length === 0) return { adjusted: 0 };

    await this.prisma.client.$transaction(
      roles.map((r) =>
        this.prisma.client.laborRole.update({
          where: { id: r.id },
          data: {
            hourlyRate: round2(
              Number(r.hourlyRate) * (1 + dto.percentage / 100),
            ),
          },
        }),
      ),
    );

    return { adjusted: roles.length };
  }
}
