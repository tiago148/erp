import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLaborRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  chargesPct?: number;

  @IsOptional()
  @IsBoolean()
  periculosidade?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  insalubridadePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  noturnoPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  beneficioHora?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ferramentalHora?: number;
}
