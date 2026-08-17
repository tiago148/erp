import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinanceAttachmentsService } from './finance-attachments.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class FinanceAttachmentsController {
  constructor(
    private readonly financeAttachmentsService: FinanceAttachmentsService,
  ) {}

  @Post('finance/entries/:id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(@Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.financeAttachmentsService.upload(id, file);
  }

  @Get('finance/entries/:id/attachments')
  findAll(@Param('id') id: string) {
    return this.financeAttachmentsService.findAll(id);
  }

  @Delete('finance/attachments/:id')
  remove(@Param('id') id: string) {
    return this.financeAttachmentsService.remove(id);
  }
}
