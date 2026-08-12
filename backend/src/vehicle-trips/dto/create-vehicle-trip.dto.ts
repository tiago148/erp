import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVehicleTripDto {
  @IsString() @IsNotEmpty() vehicleId: string;
  @IsOptional() @IsString() driverId?: string;
  @IsOptional() @IsString() projectId?: string;
  @IsString() @IsNotEmpty() origin: string;
  @IsString() @IsNotEmpty() destination: string;
  @IsOptional() @IsString() purpose?: string;
  @IsNumber() @Min(0.1) distanceKm: number;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() notes?: string;
}
