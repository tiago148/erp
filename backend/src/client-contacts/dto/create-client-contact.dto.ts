import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientContactDto {
  @IsString() @IsNotEmpty() clientId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() notes?: string;
}
