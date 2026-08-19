import { IsNotEmpty, IsString } from 'class-validator';

export class ReopenFinanceClosureDto {
  @IsString() @IsNotEmpty() reason: string;
}
