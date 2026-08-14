import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class RestoreBackupDto {
  @IsString() @IsNotEmpty() confirmationText: string;
  @IsObject() data: Record<string, unknown>;
}
