import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateToolDto {
  @IsOptional() @IsString() code?: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() category: string;
  @IsOptional() @IsString() notes?: string;
}
