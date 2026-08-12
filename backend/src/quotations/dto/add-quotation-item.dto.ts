import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class AddQuotationItemDto {
  @IsString() @IsNotEmpty() materialId: string;
  @IsNumber() @Min(0.01) quantity: number;
}
