import { IsNumber } from 'class-validator';

export class BulkAdjustPriceDto {
  @IsNumber() percentage: number;
}
