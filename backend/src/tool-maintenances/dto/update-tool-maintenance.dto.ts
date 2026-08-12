import { PartialType } from '@nestjs/mapped-types';
import { CreateToolMaintenanceDto } from './create-tool-maintenance.dto';

export class UpdateToolMaintenanceDto extends PartialType(
  CreateToolMaintenanceDto,
) {}
