import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateChecklistDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() context: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  items: string[];
}
