import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString() @IsNotEmpty() title: string;
  @IsDateString() date: string;
  @IsOptional() @IsString() description?: string;
}
