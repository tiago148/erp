import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateQuotationItemDto {
  @IsString() @IsNotEmpty() materialId: string;
  @IsNumber() @Min(0.01) quantity: number;
}

export class CreateQuotationDto {
  @IsOptional() @IsString() description?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items: CreateQuotationItemDto[];
}
