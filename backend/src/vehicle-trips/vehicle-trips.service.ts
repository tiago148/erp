import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { CreateVehicleTripDto } from './dto/create-vehicle-trip.dto';
import { CloseVehicleTripDto } from './dto/close-vehicle-trip.dto';

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

    return this.prisma.client.vehicleTrip.create({
      data: {
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        projectId: dto.projectId,
        type: dto.type,
        origin: dto.origin,
        destination: dto.destination,
        purpose: dto.purpose,
        startKm: dto.startKm ?? vehicle.currentKm,
        distanceKm: 0,
        status: 'OPEN',
        date: dto.date ? new Date(dto.date) : undefined,
        notes: dto.notes,
      },
      include: this.include(),
    });
  }

  findAll(vehicleId?: string) {
    return this.prisma.client.vehicleTrip.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      include: this.include(),
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const trip = await this.prisma.client.vehicleTrip.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!trip) throw new NotFoundException('Viagem nao encontrada.');
    return trip;
  }

  // Fechar a viagem trava a quilometragem real (em vez da distancia estimada
  // que era digitada de cabeca no fluxo antigo) e sincroniza o odometro do
  // veiculo com a leitura final — nao com um incremento, para nao acumular
  // erro se a viagem for fechada fora de ordem.
  async close(id: string, dto: CloseVehicleTripDto) {
    const trip = await this.findOne(id);
    if (trip.status !== 'OPEN') {
      throw new BadRequestException('Esta viagem ja foi fechada.');
    }

    const startKm =
      trip.startKm !== null
        ? Number(trip.startKm)
        : Number(trip.vehicle.currentKm);
    if (dto.endKm < startKm) {
      throw new BadRequestException(
        'Quilometragem final nao pode ser menor que a inicial.',
      );
    }

    const distanceKm = round2(dto.endKm - startKm);
    const newCurrentKm = Math.max(dto.endKm, Number(trip.vehicle.currentKm));

    const [updatedTrip] = await this.prisma.client.$transaction([
      this.prisma.client.vehicleTrip.update({
        where: { id },
        data: {
          startKm,
          endKm: dto.endKm,
          distanceKm,
          tollCost: dto.tollCost ?? 0,
          status: 'CLOSED',
          closedAt: new Date(),
          notes: dto.notes ?? trip.notes,
        },
        include: this.include(),
      }),
      this.prisma.client.vehicle.update({
        where: { id: trip.vehicleId },
        data: { currentKm: newCurrentKm },
      }),
    ]);

    return updatedTrip;
  }

  async remove(id: string) {
    const trip = await this.findOne(id);
    if (trip.status !== 'OPEN') {
      throw new BadRequestException(
        'So e possivel excluir viagens ainda abertas.',
      );
    }
    return this.prisma.client.vehicleTrip.delete({ where: { id } });
  }
}
