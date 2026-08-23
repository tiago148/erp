import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEppDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsString() @IsNotEmpty() itemName: string;
  @IsOptional() @IsDateString() deliveredAt?: string;
  @IsOptional() @IsBoolean() signed?: boolean;
  @IsOptional() @IsString() notes?: string;
}
