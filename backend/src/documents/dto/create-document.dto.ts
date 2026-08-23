import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum DocumentTargetType {
  VEHICLE = 'VEHICLE',
  EMPLOYEE = 'EMPLOYEE',
  TOOL = 'TOOL',
  COMPANY = 'COMPANY',
}

export class CreateDocumentDto {
  @IsEnum(DocumentTargetType) targetType: DocumentTargetType;
  @IsOptional() @IsString() targetId?: string;
  @IsString() @IsNotEmpty() targetLabel: string;
  @IsString() @IsNotEmpty() title: string;
  @IsOptional() @IsString() documentNumber?: string;
  @IsOptional() @IsDateString() issueDate?: string;
  @IsDateString() expiresAt: string;
  @IsOptional() @IsString() notes?: string;
}
