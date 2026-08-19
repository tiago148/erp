import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BulkAdjustPriceDto {
  @IsNumber() percentage: number;
  @IsOptional() @IsString() category?: string;
}
