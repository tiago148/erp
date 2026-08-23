import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateQuotationItemProposalDto {
  @IsString() @IsNotEmpty() supplierId: string;
  @IsNumber() @Min(0) unitCost: number;
  @IsOptional() @IsInt() @Min(0) leadTimeDays?: number;
  @IsOptional() @IsString() notes?: string;
}

export class CreateQuotationItemDto {
  @IsString() @IsNotEmpty() materialId: string;
  @IsNumber() @Min(0.01) quantity: number;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemProposalDto)
  proposals?: CreateQuotationItemProposalDto[];
}

export class CreateQuotationDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsDateString() quotedAt?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items: CreateQuotationItemDto[];
}
