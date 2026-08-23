import { PartialType } from '@nestjs/mapped-types';
import { CreateLaborRoleDto } from './create-labor-role.dto';

export class UpdateLaborRoleDto extends PartialType(CreateLaborRoleDto) {}
