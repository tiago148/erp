import {
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
}
