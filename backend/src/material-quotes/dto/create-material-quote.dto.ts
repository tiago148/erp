import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum FreightModality {
  FOB = 'FOB',
  CIF = 'CIF',
}

export class CreateMaterialQuoteDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freight?: number;

  @IsOptional()
  @IsEnum(FreightModality)
  freightModality?: FreightModality;

  @IsDateString()
  validUntil: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
