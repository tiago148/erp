import { PartialType } from '@nestjs/mapped-types';
import { CreateCostCompositionDto } from './create-cost-composition.dto';

export class UpdateCostCompositionDto extends PartialType(
  CreateCostCompositionDto,
) {}
