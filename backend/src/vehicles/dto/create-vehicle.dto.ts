import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  fuelType: string;

  @IsNumber()
  @Min(0.1)
  avgConsumption: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reviewIntervalKm?: number;
}
