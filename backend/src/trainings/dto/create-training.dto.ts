import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTrainingDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsString() @IsNotEmpty() nrType: string;
  @IsDateString() completedAt: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsString() notes?: string;
}
