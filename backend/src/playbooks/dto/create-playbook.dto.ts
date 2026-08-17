import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlaybookDto {
  @IsOptional() @IsString() code?: string;
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() category: string;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsString() executor?: string;
  @IsOptional() @IsString() requirements?: string;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) steps: string[];
  @IsOptional() @IsString() acceptanceCriteria?: string;
  @IsOptional() @IsString() commonErrors?: string;
  @IsOptional() @IsString() standardTime?: string;
  @IsOptional() @IsString() compositionId?: string;
  @IsOptional() @IsString() compositionLabel?: string;
  @IsOptional() @IsInt() @Min(1) version?: number;
}
