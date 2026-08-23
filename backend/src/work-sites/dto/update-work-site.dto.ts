import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkSiteDto } from './create-work-site.dto';

export class UpdateWorkSiteDto extends PartialType(CreateWorkSiteDto) {}
