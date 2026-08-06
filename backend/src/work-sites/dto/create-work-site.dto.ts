import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkSiteDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() clientId: string;
  @IsString() @IsNotEmpty() address: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsNumber() @Min(0) distanceKm?: number;
  @IsOptional() @IsString() notes?: string;
}