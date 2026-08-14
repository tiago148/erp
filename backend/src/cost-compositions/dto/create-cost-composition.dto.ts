import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  CreateCostCompositionMaterialDto,
  CreateCostCompositionLaborDto,
} from './create-cost-composition-item.dto';

export class CreateCostCompositionDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCostCompositionMaterialDto)
  materials?: CreateCostCompositionMaterialDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCostCompositionLaborDto)
  labor?: CreateCostCompositionLaborDto[];
}
