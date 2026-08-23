import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum FixedExpenseType {
  FIXED = 'FIXED',
  SEMI_VARIABLE = 'SEMI_VARIABLE',
}

export class CreateFixedExpenseDto {
  @IsString() @IsNotEmpty() description: string;
  @IsString() @IsNotEmpty() category: string;
  @IsNumber() @Min(0) amount: number;
  @IsOptional() @IsEnum(FixedExpenseType) type?: FixedExpenseType;
  @IsOptional() @IsBoolean() generatesBill?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(28) billDay?: number;
  @IsOptional() @IsString() supplierName?: string;
  @IsOptional() @IsString() notes?: string;
}
