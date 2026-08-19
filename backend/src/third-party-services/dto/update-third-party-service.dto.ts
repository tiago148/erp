import { PartialType } from '@nestjs/mapped-types';
import { CreateThirdPartyServiceDto } from './create-third-party-service.dto';

export class UpdateThirdPartyServiceDto extends PartialType(
  CreateThirdPartyServiceDto,
) {}
