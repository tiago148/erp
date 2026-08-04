import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto) {
    const existing = await this.prisma.client.vehicle.findUnique({
      where: { plate: dto.plate },
    });

    if (existing) {
      throw new ConflictException('Ja existe um veiculo com esta placa.');
    }

    return this.prisma.client.vehicle.create({ data: dto });
  }

  findAll(search?: string) {
    return this.prisma.client.vehicle.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { plate: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.client.vehicle.findUnique({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException('Veiculo nao encontrado.');
    }

    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);
    return this.prisma.client.vehicle.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.vehicle.delete({ where: { id } });
  }
}
