import { IsArray, IsString } from 'class-validator';

export class UpdateUserModulesDto {
  @IsArray() @IsString({ each: true }) allowedModules: string[];
}
