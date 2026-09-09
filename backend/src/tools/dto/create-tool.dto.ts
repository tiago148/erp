import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum ToolCustody {
  SHARED = 'SHARED',
  INDIVIDUAL = 'INDIVIDUAL',
  FIXED = 'FIXED',
}

export class CreateToolDto {
  @IsOptional() @IsString() code?: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() category: string;
  @IsOptional() @IsEnum(ToolCustody) custody?: ToolCustody;
  @IsOptional() @IsString() responsibleEmployeeId?: string;
  @IsOptional() @IsNumber() @Min(0) acquisitionValue?: number;
  @IsOptional() @IsString() notes?: string;
}
