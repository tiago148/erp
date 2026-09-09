import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CyclicCountItemDto {
  @IsString() stockItemId: string;
  @IsNumber() countedQty: number;
}

export class CreateCyclicCountDto {
  @IsOptional() @IsDateString() countDate?: string;
  @IsIn(['A', 'B', 'C', 'D']) className: string;
  @IsOptional() @IsString() responsibleId?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CyclicCountItemDto)
  items: CyclicCountItemDto[];
}
