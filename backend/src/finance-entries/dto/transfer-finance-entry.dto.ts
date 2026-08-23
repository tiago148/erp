import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class TransferFinanceEntryDto {
  @IsString() @IsNotEmpty() fromAccountId: string;
  @IsString() @IsNotEmpty() toAccountId: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsDateString() date?: string;
}
