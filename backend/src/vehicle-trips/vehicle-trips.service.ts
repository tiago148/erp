import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleTripDto } from './dto/create-vehicle-trip.dto';

@Injectable()
export class VehicleTripsService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { vehicle: true, driver: true, project: true };
  }

  async create(dto: CreateVehicleTripDto) {
    const vehicle = await this.prisma.client.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Veiculo nao encontrado.');

    const [trip] = await this.prisma.client.$transaction([
      this.prisma.client.vehicleTrip.create({
        data: {
          vehicleId: dto.vehicleId,
          driverId: dto.driverId,
          projectId: dto.projectId,
          origin: dto.origin,
          destination: dto.destination,
          purpose: dto.purpose,
          distanceKm: dto.distanceKm,
          date: dto.date ? new Date(dto.date) : undefined,
          notes: dto.notes,
        },
        include: this.include(),
      }),
      this.prisma.client.vehicle.update({
        where: { id: dto.vehicleId },
        data: { currentKm: { increment: dto.distanceKm } },
      }),
    ]);

    return trip;
  }

  findAll(vehicleId?: string) {
    return this.prisma.client.vehicleTrip.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      include: this.include(),
      orderBy: { date: 'desc' },
    });
  }
}
