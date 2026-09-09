import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChargeToolDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsOptional() @IsDateString() chargedAt?: string;
  @IsOptional() @IsString() conditionOut?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
}

export class ReturnToolChargeDto {
  @IsOptional() @IsDateString() returnedAt?: string;
  @IsOptional() @IsString() returnReason?: string;
}
