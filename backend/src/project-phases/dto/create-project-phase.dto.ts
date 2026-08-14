import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProjectPhaseDto {
  @IsString() @IsNotEmpty() projectId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) @Max(100) weightPct: number;
  @IsDateString() plannedStart: string;
  @IsDateString() plannedEnd: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) progressPct?: number;
  @IsOptional() @IsDateString() measuredAt?: string;
  @IsOptional() @IsString() notes?: string;
}
