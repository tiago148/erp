import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { CreateThirdPartyServiceDto } from './dto/create-third-party-service.dto';
import { UpdateThirdPartyServiceDto } from './dto/update-third-party-service.dto';
import { BulkAdjustPriceDto } from './dto/bulk-adjust-price.dto';

@Injectable()
export class ThirdPartyServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateThirdPartyServiceDto) {
    return this.prisma.client.thirdPartyService.create({ data: dto });
  }

  async findAll(search?: string) {
    return this.prisma.client.thirdPartyService.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.client.thirdPartyService.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Servico de terceiro nao encontrado.');
    }

    return service;
  }

  async update(id: string, dto: UpdateThirdPartyServiceDto) {
    await this.findOne(id);
    return this.prisma.client.thirdPartyService.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const inUse = await this.prisma.client.budgetServiceItem.findFirst({
      where: { thirdPartyServiceId: id },
    });
    if (inUse) {
      throw new ConflictException(
        'Nao e possivel excluir: servico ja utilizado em orcamento(s).',
      );
    }
    return this.prisma.client.thirdPartyService.delete({ where: { id } });
  }

  async bulkAdjustPrice(dto: BulkAdjustPriceDto) {
    const services = await this.prisma.client.thirdPartyService.findMany({
      where: dto.category ? { category: dto.category } : undefined,
    });
    if (services.length === 0) return { adjusted: 0 };

    await this.prisma.client.$transaction(
      services.map((s) =>
        this.prisma.client.thirdPartyService.update({
          where: { id: s.id },
          data: {
            unitPrice: round2(Number(s.unitPrice) * (1 + dto.percentage / 100)),
          },
        }),
      ),
    );

    return { adjusted: services.length };
  }
}
