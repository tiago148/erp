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
import { MaterialQuotesService } from './material-quotes.service';
import { CreateMaterialQuoteDto } from './dto/create-material-quote.dto';
import { UpdateMaterialQuoteDto } from './dto/update-material-quote.dto';

@Controller('material-quotes')
@UseGuards(JwtAuthGuard)
export class MaterialQuotesController {
  constructor(private readonly materialQuotesService: MaterialQuotesService) {}

  @Post() create(@Body() dto: CreateMaterialQuoteDto) {
    return this.materialQuotesService.create(dto);
  }

  @Get() findAll(@Query('materialId') materialId?: string) {
    return this.materialQuotesService.findAll(materialId);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.materialQuotesService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialQuoteDto,
  ) {
    return this.materialQuotesService.update(id, dto);
  }

  @Delete(':id') remove(@Param('id') id: string) {
    return this.materialQuotesService.remove(id);
  }
}
