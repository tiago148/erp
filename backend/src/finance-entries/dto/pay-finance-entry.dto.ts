import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class PayFinanceEntryDto {
  @IsOptional() @IsDateString() paidAt?: string;
  @IsOptional() @IsNumber() @Min(0.01) paidAmount?: number;
  // So exigido quando a data de pagamento cai dentro de um periodo ja FECHADO.
  @IsOptional() @IsString() overrideReason?: string;
}
