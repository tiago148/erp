import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ToolLocation {
  COMPANY = 'COMPANY',
  PROJECT = 'PROJECT',
}

export class MoveToolDto {
  @IsEnum(ToolLocation) toLocation: ToolLocation;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() responsible?: string;
  @IsOptional() @IsString() notes?: string;
}
