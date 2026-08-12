import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateToolMaintenanceDto {
  @IsString() @IsNotEmpty() toolId: string;
  @IsDateString() date: string;
  @IsString() @IsNotEmpty() type: string;
  @IsNumber() @Min(0) cost: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() supplierName?: string;
}
