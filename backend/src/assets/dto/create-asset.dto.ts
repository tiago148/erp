import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  @Min(0)
  acquisitionValue: number;

  @IsDateString()
  acquisitionDate: string;

  @IsInt()
  @Min(1)
  usefulLifeMonths: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  residualValue?: number;

  @IsOptional()
  @IsIn(['INDIRECT', 'HOURLY', 'TOOLING'])
  absorptionMode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  productiveHoursPerYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  annualMaintenance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  operatingCostPerHour?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
