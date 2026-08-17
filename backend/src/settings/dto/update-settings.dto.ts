import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum TaxRegime {
  SIMPLES = 'SIMPLES',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
  MEI = 'MEI',
}

export enum OverheadMethod {
  DAY = 'DAY',
  HOUR = 'HOUR',
  PERCENT = 'PERCENT',
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
  @IsOptional() @IsNumber() @Min(0) defaultLucroPct?: number;
  @IsOptional() @IsNumber() @Min(0) defaultContingenciaPct?: number;
  @IsOptional() @IsNumber() @Min(0) defaultTaxaCapitalPct?: number;
  @IsOptional() @IsNumber() @Min(0) defaultChargesPct?: number;
  @IsOptional() @IsNumber() @Min(0) salarioMinimo?: number;
  @IsOptional() @IsNumber() @Min(0) defaultFuelPrice?: number;
  @IsOptional() @IsString() budgetPrefix?: string;
  @IsOptional() @IsString() projectPrefix?: string;
  @IsOptional() @IsNumber() @Min(0) marginHealthyPct?: number;
  @IsOptional() @IsNumber() @Min(0) marginWarningPct?: number;
  @IsOptional() @IsEnum(OverheadMethod) overheadMethod?: OverheadMethod;
  @IsOptional() @IsInt() @Min(1) overheadFuncCount?: number;
  @IsOptional() @IsInt() @Min(1) overheadHoursPerMonth?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(100) overheadOccupancyPct?: number;
  @IsOptional() @IsInt() @Min(1) overheadWorkDaysPerMonth?: number;
  @IsOptional() @IsNumber() @Min(0) overheadAvgDirectCost?: number;
  @IsOptional() @IsInt() @Min(1) overheadSimultaneousProjects?: number;
  @IsOptional() @IsBoolean() overheadAutoApply?: boolean;
  @IsOptional() @IsNumber() @Min(0) assetOpportunityCostPct?: number;
}
