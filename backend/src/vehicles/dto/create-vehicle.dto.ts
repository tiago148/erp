import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

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
}
