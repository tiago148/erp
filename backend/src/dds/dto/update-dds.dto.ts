import { PartialType } from '@nestjs/mapped-types';
import { CreateDdsDto } from './create-dds.dto';

export class UpdateDdsDto extends PartialType(CreateDdsDto) {}
