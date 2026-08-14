import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentTargetType } from '../../generated/prisma/enums';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post() create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get() findAll(@Query('targetType') targetType?: DocumentTargetType) {
    return this.documentsService.findAll(targetType);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, dto);
  }

  @Delete(':id') remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
