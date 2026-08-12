import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMaterialSurplusDto {
  @IsString() @IsNotEmpty() projectId: string;
  @IsString() @IsNotEmpty() materialId: string;
  @IsNumber() @Min(0.01) quantity: number;
  @IsOptional() @IsString() notes?: string;
}
