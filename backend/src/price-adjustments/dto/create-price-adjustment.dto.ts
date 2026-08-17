import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum PriceAdjustmentTarget {
  LABOR_ROLE = 'LABOR_ROLE',
  MATERIAL = 'MATERIAL',
  FIXED_EXPENSE = 'FIXED_EXPENSE',
}

export class CreatePriceAdjustmentDto {
  @IsEnum(PriceAdjustmentTarget)
  target: PriceAdjustmentTarget;

  @IsNumber()
  percentage: number;

  @IsOptional()
  @IsString()
  categoryFilter?: string;
}
