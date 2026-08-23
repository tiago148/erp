import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { MoveToolDto } from './dto/move-tool.dto';

@Controller('tools')
@UseGuards(JwtAuthGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post() create(@Body() dto: CreateToolDto) { return this.toolsService.create(dto); }

  @Get() findAll(@Query('search') search?: string) { return this.toolsService.findAll(search); }

  @Get(':id') findOne(@Param('id') id: string) { return this.toolsService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateToolDto) { return this.toolsService.update(id, dto); }

  @Post(':id/move') move(@Param('id') id: string, @Body() dto: MoveToolDto) { return this.toolsService.move(id, dto); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) { return this.toolsService.remove(id); }
}
