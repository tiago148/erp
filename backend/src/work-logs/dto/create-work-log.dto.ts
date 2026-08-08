import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkLogDto {
  @IsString() @IsNotEmpty() projectId: string;
  @IsDateString() date: string;
  @IsOptional() @IsString() weather?: string;
  @IsOptional() @IsInt() @Min(0) workersPresent?: number;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsString() occurrences?: string;
}
