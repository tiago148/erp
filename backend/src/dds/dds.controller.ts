import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DdsService } from './dds.service';
import { CreateDdsDto } from './dto/create-dds.dto';
import { UpdateDdsDto } from './dto/update-dds.dto';

@Controller('dds')
@UseGuards(JwtAuthGuard)
export class DdsController {
  constructor(private readonly ddsService: DdsService) {}

  @Post() create(@Body() dto: CreateDdsDto) { return this.ddsService.create(dto); }

  @Get() findAll() { return this.ddsService.findAll(); }

  @Get(':id') findOne(@Param('id') id: string) { return this.ddsService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateDdsDto) { return this.ddsService.update(id, dto); }

  @Delete(':id') remove(@Param('id') id: string) { return this.ddsService.remove(id); }
}
