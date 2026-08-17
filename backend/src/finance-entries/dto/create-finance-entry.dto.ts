import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum FinanceEntryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum RecurrenceFrequency {
  NONE = 'NONE',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export class CreateFinanceEntryDto {
  @IsEnum(FinanceEntryType) type: FinanceEntryType;

  @IsString() @IsNotEmpty() description: string;

  @IsString() @IsNotEmpty() categoryId: string;

  @IsNumber() @Min(0.01) amount: number;

  @IsDateString() dueDate: string;

  @IsOptional() @IsEnum(RecurrenceFrequency) recurrence?: RecurrenceFrequency;

  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() supplierId?: string;
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsString() purchaseOrderId?: string;
  @IsOptional() @IsString() budgetId?: string;
  @IsOptional() @IsString() notes?: string;
}
