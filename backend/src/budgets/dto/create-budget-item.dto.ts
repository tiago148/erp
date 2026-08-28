import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateBudgetMaterialItemMeasureDto {
  @IsNumber()
  @Min(0.001)
  lengthM: number;

  @IsInt()
  @Min(1)
  pieces: number;
}

export class CreateBudgetMaterialItemDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetMaterialItemMeasureDto)
  measures?: CreateBudgetMaterialItemMeasureDto[];
}

export class CreateBudgetLaborItemDto {
  @IsString()
  @IsNotEmpty()
  laborRoleId: string;

  @IsNumber()
  @Min(0.01)
  hours: number;
}

export class CreateBudgetTravelItemDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsNumber()
  @Min(0.1)
  distanceKm: number;

  @IsNumber()
  @Min(1)
  trips: number;

  @IsNumber()
  @Min(0)
  fuelPrice: number;
}

export class CreateBudgetOtherItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateBudgetCompositionItemDto {
  @IsString()
  @IsNotEmpty()
  compositionId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreateBudgetServiceItemDto {
  @IsString()
  @IsNotEmpty()
  thirdPartyServiceId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreateBudgetRentalItemDto {
  @IsString()
  @IsNotEmpty()
  rentalEquipmentId: string;

  @IsNumber()
  @Min(1)
  period: number;
}
