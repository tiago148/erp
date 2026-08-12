import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum FinanceEntryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateFinanceCategoryDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEnum(FinanceEntryType) type: FinanceEntryType;
}
