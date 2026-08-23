import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { calculateAssetMonthlyCost } from '../common/asset-depreciation';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOpportunityCostPct() {
    const settings = await this.prisma.client.settings.findFirst();
    return settings ? Number(settings.assetOpportunityCostPct) : 1;
  }

  private withDepreciation(asset: any, opportunityCostPct: number) {
    const result = calculateAssetMonthlyCost(
      {
        acquisitionValue: Number(asset.acquisitionValue),
        acquisitionDate: asset.acquisitionDate,
        usefulLifeMonths: asset.usefulLifeMonths,
        residualValue: Number(asset.residualValue),
      },
      opportunityCostPct,
    );
    return {
      ...asset,
      monthlyDepreciation: round2(result.monthlyDepreciation),
      accumulatedDepreciation: round2(result.accumulatedDepreciation),
      bookValue: round2(result.bookValue),
      isFullyDepreciated: result.isFullyDepreciated,
      depreciationContribution: round2(result.depreciationContribution),
      opportunityCostContribution: round2(result.opportunityCostContribution),
      totalMonthlyCost: round2(result.totalMonthlyCost),
    };
  }

  async create(dto: CreateAssetDto) {
    const asset = await this.prisma.client.asset.create({
      data: {
        ...dto,
        acquisitionDate: new Date(dto.acquisitionDate),
      },
    });
    return this.withDepreciation(asset, await this.getOpportunityCostPct());
  }

  async findAll() {
    const [assets, opportunityCostPct] = await Promise.all([
      this.prisma.client.asset.findMany({ orderBy: { name: 'asc' } }),
      this.getOpportunityCostPct(),
    ]);
    return assets.map((asset) =>
      this.withDepreciation(asset, opportunityCostPct),
    );
  }

  async findOne(id: string) {
    const [asset, opportunityCostPct] = await Promise.all([
      this.prisma.client.asset.findUnique({ where: { id } }),
      this.getOpportunityCostPct(),
    ]);
    if (!asset) throw new NotFoundException('Patrimonio nao encontrado.');
    return this.withDepreciation(asset, opportunityCostPct);
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.findOne(id);
    const asset = await this.prisma.client.asset.update({
      where: { id },
      data: {
        ...dto,
        acquisitionDate: dto.acquisitionDate
          ? new Date(dto.acquisitionDate)
          : undefined,
      },
    });
    return this.withDepreciation(asset, await this.getOpportunityCostPct());
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.asset.delete({ where: { id } });
  }
}
