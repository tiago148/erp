import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CreateBudgetMaterialItemDto,
  CreateBudgetLaborItemDto,
  CreateBudgetTravelItemDto,
  CreateBudgetOtherItemDto,
} from './create-budget-item.dto';

export enum BudgetStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEGOTIATING = 'NEGOTIATING',
}

export enum TaxRegime {
  SIMPLES = 'SIMPLES',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
  MEI = 'MEI',
}

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @IsOptional()
  @IsEnum(TaxRegime)
  regime?: TaxRegime;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bdiPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPct?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  projectDays?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetMaterialItemDto)
  materialItems?: CreateBudgetMaterialItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetLaborItemDto)
  laborItems?: CreateBudgetLaborItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetTravelItemDto)
  travelItems?: CreateBudgetTravelItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetOtherItemDto)
  otherItems?: CreateBudgetOtherItemDto[];
}
