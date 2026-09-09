import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateStockItemDto {
  @IsString() @IsNotEmpty() materialId: string;
  @IsNumber() @Min(0) quantity: number;
  @IsNumber() @Min(0) minQuantity: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() addrStreet?: string;
  @IsOptional() @IsString() addrShelf?: string;
  @IsOptional() @IsString() addrLevel?: string;
  @IsOptional() @IsString() addrPosition?: string;
  @IsOptional() @IsIn(['AUTO', 'A', 'B', 'C']) abcClass?: string;
  @IsOptional() @IsNumber() @Min(0) monthlyConsumption?: number;
  @IsOptional() @IsInt() @Min(1) leadTimeDays?: number;
  @IsOptional() @IsNumber() @Min(0) serviceLevelZ?: number;
}
