import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLessonLearnedDto {
  @IsDateString() date: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() projectLabel?: string;
  @IsString() @IsNotEmpty() category: string;
  @IsString() @IsNotEmpty() whatHappened: string;
  @IsOptional() @IsString() rootCause?: string;
  @IsOptional() @IsNumber() @Min(0) estimatedCost?: number;
  @IsOptional() @IsNumber() @Min(0) hoursLost?: number;
  @IsString() @IsNotEmpty() actionTaken: string;
  @IsOptional() @IsString() responsibleEmployeeId?: string;
  @IsOptional() @IsString() responsibleLabel?: string;
  @IsOptional() @IsBoolean() becameProcedure?: boolean;
}
