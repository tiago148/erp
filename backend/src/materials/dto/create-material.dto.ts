import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum MaterialReferenceMode {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
}

export class CreateMaterialDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsEnum(MaterialReferenceMode)
  referenceMode?: MaterialReferenceMode;

  @IsOptional()
  @IsString()
  manualQuoteId?: string;
}
