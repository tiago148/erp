import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateProjectBillingItemDto {
  @IsOptional() @IsString() @IsNotEmpty() description?: string;
  @IsOptional() @IsNumber() @Min(0.01) amount?: number;
  @IsOptional() @IsDateString() plannedDate?: string;
  @IsOptional() @IsString() notes?: string;
}
