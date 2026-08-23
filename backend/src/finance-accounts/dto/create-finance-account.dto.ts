import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum FinanceAccountType {
  CAIXA = 'CAIXA',
  BANCO = 'BANCO',
}

export class CreateFinanceAccountDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsEnum(FinanceAccountType) type?: FinanceAccountType;
  @IsOptional() @IsNumber() initialBalance?: number;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() active?: boolean;
}
