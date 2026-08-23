import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AddQuotationProposalDto {
  @IsString() @IsNotEmpty() supplierId: string;
  @IsNumber() @Min(0) unitCost: number;
  @IsOptional() @IsInt() @Min(0) leadTimeDays?: number;
  @IsOptional() @IsString() notes?: string;
}
