import { PartialType } from '@nestjs/mapped-types';
import { CreateEppDto } from './create-epp.dto';

export class UpdateEppDto extends PartialType(CreateEppDto) {}
