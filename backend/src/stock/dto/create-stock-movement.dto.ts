import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
}

export class CreateStockMovementDto {
  @IsEnum(StockMovementType) type: StockMovementType;
  @IsNumber() @Min(0.01) quantity: number;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() notes?: string;
}
