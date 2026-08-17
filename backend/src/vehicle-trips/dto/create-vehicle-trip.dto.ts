import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum VehicleTripType {
  FRETE = 'FRETE',
  ENTREGA = 'ENTREGA',
  COLETA = 'COLETA',
  COMPRA = 'COMPRA',
  VISITA = 'VISITA',
  OUTRO = 'OUTRO',
}

export class CreateVehicleTripDto {
  @IsString() @IsNotEmpty() vehicleId: string;
  @IsOptional() @IsString() driverId?: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsEnum(VehicleTripType) type?: VehicleTripType;
  @IsString() @IsNotEmpty() origin: string;
  @IsString() @IsNotEmpty() destination: string;
  @IsOptional() @IsString() purpose?: string;
  @IsOptional() @IsNumber() @Min(0) startKm?: number;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() notes?: string;
}
