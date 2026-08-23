import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CloseFinanceClosureDto {
  @IsNumber() informedBalance: number;
  @IsOptional() @IsString() notes?: string;
}
