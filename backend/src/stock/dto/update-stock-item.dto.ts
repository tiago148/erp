import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateStockItemDto {
  @IsOptional() @IsNumber() @Min(0) minQuantity?: number;
}
