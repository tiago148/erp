import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseVehicleTripDto {
  @IsNumber() @Min(0) endKm: number;
  @IsOptional() @IsNumber() @Min(0) tollCost?: number;
  @IsOptional() @IsString() notes?: string;
}
