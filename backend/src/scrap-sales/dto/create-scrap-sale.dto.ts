import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateScrapSaleDto {
  @IsOptional() @IsString() surplusId?: string;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsNumber() @Min(0) weightKg?: number;
  @IsOptional() @IsNumber() @Min(0) pricePerKg?: number;
  @IsNumber() @Min(0.01) totalValue: number;
  @IsOptional() @IsString() buyerName?: string;
  @IsOptional() @IsDateString() saleDate?: string;
  @IsOptional() @IsString() notes?: string;
}
