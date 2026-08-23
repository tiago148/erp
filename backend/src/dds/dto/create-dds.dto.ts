import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDdsDto {
  @IsDateString() date: string;
  @IsString() @IsNotEmpty() topic: string;
  @IsOptional() @IsArray() @IsString({ each: true }) participants?: string[];
  @IsOptional() @IsString() notes?: string;
}
