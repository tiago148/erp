import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AddQuotationProposalDto {
  @IsString() @IsNotEmpty() supplierId: string;
  @IsNumber() @Min(0) unitCost: number;
  @IsOptional() @IsString() notes?: string;
}
