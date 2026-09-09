import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import {
  calculateAssetMonthlyCost,
  computeHourlyMachineCost,
} from '../common/asset-depreciation';
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
    const mode = (asset.absorptionMode as string) ?? 'INDIRECT';
    const hourly =
      mode === 'HOURLY'
        ? computeHourlyMachineCost(
            {
              acquisitionValue: Number(asset.acquisitionValue),
              acquisitionDate: asset.acquisitionDate,
              usefulLifeMonths: asset.usefulLifeMonths,
              residualValue: Number(asset.residualValue),
              productiveHoursPerYear: Number(asset.productiveHoursPerYear) || 1200,
              annualMaintenance: Number(asset.annualMaintenance) || 0,
              operatingCostPerHour: Number(asset.operatingCostPerHour) || 0,
            },
            opportunityCostPct,
          )
        : null;

    return {
      ...asset,
      monthlyDepreciation: round2(result.monthlyDepreciation),
      accumulatedDepreciation: round2(result.accumulatedDepreciation),
      bookValue: round2(result.bookValue),
      isFullyDepreciated: result.isFullyDepreciated,
      depreciationContribution: round2(result.depreciationContribution),
      opportunityCostContribution: round2(result.opportunityCostContribution),
      // So bens de absorcao INDIRETA entram no pool de rateio da estrutura.
      totalMonthlyCost:
        mode === 'INDIRECT' ? round2(result.totalMonthlyCost) : 0,
      poolMonthlyCost: round2(result.totalMonthlyCost),
      hourlyMachineCost: hourly ? round2(hourly.hourlyRate) : 0,
    };
  }

  async create(dto: CreateAssetDto) {
    const asset = await this.prisma.client.asset.create({
      data: {
        ...dto,
        absorptionMode: dto.absorptionMode as any,
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
        absorptionMode: dto.absorptionMode as any,
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
