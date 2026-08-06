import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkSiteDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() clientId: string;
  @IsString() @IsNotEmpty() address: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() notes?: string;
}
