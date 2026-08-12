import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class WorkLogVehicleDto {
  @IsString() @IsNotEmpty() vehicleId: string;
  @IsOptional() @IsString() driverId?: string;
}

export class CreateWorkLogDto {
  @IsString() @IsNotEmpty() projectId: string;
  @IsDateString() date: string;
  @IsOptional() @IsString() weather?: string;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsString() occurrences?: string;
  @IsOptional() @IsBoolean() noTravel?: boolean;

  @IsOptional() @IsArray() @IsString({ each: true }) employeeIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkLogVehicleDto)
  vehicles?: WorkLogVehicleDto[];

  @IsOptional() @IsArray() @IsString({ each: true }) toolIds?: string[];
}
