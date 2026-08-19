import { PartialType } from '@nestjs/mapped-types';
import { CreateRentalEquipmentDto } from './create-rental-equipment.dto';

export class UpdateRentalEquipmentDto extends PartialType(
  CreateRentalEquipmentDto,
) {}
