import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateBudgetMaterialItemDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
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
