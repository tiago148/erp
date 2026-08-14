import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateCostCompositionMaterialDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsNumber()
  @Min(0.0001)
  coefficient: number;
}

export class CreateCostCompositionLaborDto {
  @IsString()
  @IsNotEmpty()
  laborRoleId: string;

  @IsNumber()
  @Min(0.0001)
  hoursPerUnit: number;
}
