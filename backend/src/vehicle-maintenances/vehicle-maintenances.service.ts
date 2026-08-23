import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOrCreateCategory } from '../common/finance';
import { CreateVehicleMaintenanceDto } from './dto/create-vehicle-maintenance.dto';
import { UpdateVehicleMaintenanceDto } from './dto/update-vehicle-maintenance.dto';

@Injectable()
export class VehicleMaintenancesService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { vehicle: true, financeEntry: true };
  }

  async create(dto: CreateVehicleMaintenanceDto) {
    const vehicle = await this.prisma.client.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Veiculo nao encontrado.');

    let financeEntryId: string | undefined;
    if (dto.cost > 0) {
      const category = await getOrCreateCategory(
        this.prisma,
        'Manutencao de Veiculos',
        'EXPENSE',
      );
      const financeEntry = await this.prisma.client.financeEntry.create({
        data: {
          type: 'EXPENSE',
          description: `Manutencao (${dto.type}) - ${vehicle.name} (${vehicle.plate})`,
          categoryId: category.id,
          amount: dto.cost,
          dueDate: new Date(dto.date),
          vehicleId: dto.vehicleId,
        },
      });
      financeEntryId = financeEntry.id;
    }

    return this.prisma.client.vehicleMaintenance.create({
      data: {
        vehicleId: dto.vehicleId,
        date: new Date(dto.date),
        km: dto.km,
        type: dto.type,
        cost: dto.cost,
        description: dto.description,
        supplierName: dto.supplierName,
        financeEntryId,
      },
      include: this.include(),
    });
  }

  findAll(vehicleId?: string) {
    return this.prisma.client.vehicleMaintenance.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      include: this.include(),
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const maintenance = await this.prisma.client.vehicleMaintenance.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!maintenance) throw new NotFoundException('Manutencao nao encontrada.');
    return maintenance;
  }

  async update(id: string, dto: UpdateVehicleMaintenanceDto) {
    await this.findOne(id);
    return this.prisma.client.vehicleMaintenance.update({
      where: { id },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        km: dto.km,
        type: dto.type,
        cost: dto.cost,
        description: dto.description,
        supplierName: dto.supplierName,
      },
      include: this.include(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.vehicleMaintenance.delete({ where: { id } });
  }
}
