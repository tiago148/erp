import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateStockItemDto {
  @IsString() @IsNotEmpty() materialId: string;
  @IsNumber() @Min(0) quantity: number;
  @IsNumber() @Min(0) minQuantity: number;
  @IsOptional() @IsString() location?: string;
}
