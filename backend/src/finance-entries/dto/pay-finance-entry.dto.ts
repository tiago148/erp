import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class PayFinanceEntryDto {
  @IsOptional() @IsDateString() paidAt?: string;
  @IsOptional() @IsNumber() @Min(0.01) paidAmount?: number;
}
