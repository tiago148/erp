import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProjectBillingItemDto {
  @IsString() @IsNotEmpty() projectId: string;
  @IsString() @IsNotEmpty() description: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsDateString() plannedDate: string;
  @IsOptional() @IsString() notes?: string;
}
