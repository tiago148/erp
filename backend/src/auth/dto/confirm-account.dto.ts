import { IsString, MinLength } from 'class-validator';

export class ConfirmAccountDto {
  @IsString() token: string;
  @IsString() @MinLength(6) password: string;
}
