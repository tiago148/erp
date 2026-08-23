import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateFinanceEntryDto } from './create-finance-entry.dto';

export class UpdateFinanceEntryDto extends PartialType(CreateFinanceEntryDto) {
  // So exigido quando o lancamento pertence a um periodo ja FECHADO --
  // ver FinanceClosuresService.isDateLocked().
  @IsOptional() @IsString() overrideReason?: string;
}
