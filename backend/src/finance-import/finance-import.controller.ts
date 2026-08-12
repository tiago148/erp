import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinanceImportService, ImportMapping } from './finance-import.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Controller('finance/import')
@UseGuards(JwtAuthGuard)
export class FinanceImportController {
  constructor(private readonly financeImportService: FinanceImportService) {}

  @Post('preview')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  preview(@UploadedFile() file?: Express.Multer.File) {
    return this.financeImportService.preview(file);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  import(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('mapping') mappingJson: string,
  ) {
    let mapping: ImportMapping;
    try {
      mapping = JSON.parse(mappingJson) as ImportMapping;
    } catch {
      throw new BadRequestException('Mapeamento invalido.');
    }
    return this.financeImportService.import(file, mapping);
  }
}
