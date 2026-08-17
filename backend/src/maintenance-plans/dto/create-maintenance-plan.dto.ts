import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum MaintenanceTargetType {
  VEHICLE = 'VEHICLE',
  TOOL = 'TOOL',
}

export enum MaintenanceIntervalType {
  KM = 'KM',
  MONTHS = 'MONTHS',
}

export class CreateMaintenancePlanDto {
  @IsEnum(MaintenanceTargetType) targetType: MaintenanceTargetType;
  @IsString() @IsNotEmpty() targetId: string;
  @IsString() @IsNotEmpty() targetLabel: string;
  @IsString() @IsNotEmpty() name: string;

  @IsEnum(MaintenanceIntervalType) intervalType: MaintenanceIntervalType;
  @IsOptional() @IsNumber() @Min(1) intervalKm?: number;
  @IsOptional() @IsInt() @Min(1) intervalMonths?: number;

  @IsOptional() @IsNumber() @Min(0) alertThresholdKm?: number;
  @IsOptional() @IsInt() @Min(0) alertThresholdDays?: number;

  @IsOptional() @IsDateString() lastServiceDate?: string;
  @IsOptional() @IsNumber() @Min(0) lastServiceKm?: number;

  @IsOptional() @IsString() notes?: string;
}
