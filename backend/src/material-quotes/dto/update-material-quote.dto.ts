import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialQuoteDto } from './create-material-quote.dto';

export class UpdateMaterialQuoteDto extends PartialType(
  CreateMaterialQuoteDto,
) {}
