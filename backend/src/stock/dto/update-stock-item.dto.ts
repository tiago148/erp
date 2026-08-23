import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStockItemDto {
  @IsOptional() @IsNumber() @Min(0) minQuantity?: number;
  @IsOptional() @IsString() location?: string;
}
