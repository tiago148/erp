import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVehicleMaintenanceDto {
  @IsString() @IsNotEmpty() vehicleId: string;
  @IsDateString() date: string;
  @IsNumber() @Min(0) km: number;
  @IsString() @IsNotEmpty() type: string;
  @IsNumber() @Min(0) cost: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() supplierName?: string;
}
