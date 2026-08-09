import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum TaxRegime {
  SIMPLES = 'SIMPLES',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
  MEI = 'MEI',
}

export class UpdateSettingsDto {
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() companyDocument?: string;
  @IsOptional() @IsString() companyIe?: string;
  @IsOptional() @IsString() companyAddress?: string;
  @IsOptional() @IsString() companyPhone?: string;
  @IsOptional() @IsString() companyEmail?: string;
  @IsOptional() @IsEnum(TaxRegime) defaultRegime?: TaxRegime;
  @IsOptional() @IsNumber() @Min(0) defaultBdiPct?: number;
  @IsOptional() @IsNumber() @Min(0) defaultChargesPct?: number;
  @IsOptional() @IsNumber() @Min(0) defaultFuelPrice?: number;
  @IsOptional() @IsString() budgetPrefix?: string;
  @IsOptional() @IsString() projectPrefix?: string;
}
