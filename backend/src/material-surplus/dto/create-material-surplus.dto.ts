import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum SurplusShape {
  CHAPA = 'CHAPA',
  BARRA_TUBO = 'BARRA_TUBO',
  FIO = 'FIO',
  OUTRO = 'OUTRO',
}

export enum SurplusDestination {
  ESTOQUE = 'ESTOQUE',
  RETALHO = 'RETALHO',
  SUCATA = 'SUCATA',
}

export class CreateMaterialSurplusDto {
  @IsString() @IsNotEmpty() projectId: string;
  @IsString() @IsNotEmpty() materialId: string;
  @IsNumber() @Min(0.01) quantity: number;

  @IsOptional() @IsEnum(SurplusShape) shape?: SurplusShape;
  @IsOptional() @IsString() alloy?: string;
  @IsOptional() @IsNumber() @Min(0) length?: number;
  @IsOptional() @IsNumber() @Min(0) width?: number;
  @IsOptional() @IsNumber() @Min(0) unitValue?: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsEnum(SurplusDestination) destination?: SurplusDestination;

  @IsOptional() @IsString() notes?: string;
}
