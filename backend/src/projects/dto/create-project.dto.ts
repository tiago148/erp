import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateProjectDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() clientId: string;
  @IsOptional() @IsString() workSiteId?: string;
  @IsOptional() @IsString() budgetId?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsNumber() @Min(0) budgetAmount?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() responsibleEmployeeId?: string;
}
