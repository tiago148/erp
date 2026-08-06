import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkSitesService } from './work-sites.service';
import { CreateWorkSiteDto } from './dto/create-work-site.dto';
import { UpdateWorkSiteDto } from './dto/update-work-site.dto';

@Controller('work-sites')
@UseGuards(JwtAuthGuard)
export class WorkSitesController {
  constructor(private readonly workSitesService: WorkSitesService) {}

  @Post() create(@Body() dto: CreateWorkSiteDto) { return this.workSitesService.create(dto); }

  @Get() findAll(@Query('search') search?: string) { return this.workSitesService.findAll(search); }

  @Get(':id') findOne(@Param('id') id: string) { return this.workSitesService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateWorkSiteDto) { return this.workSitesService.update(id, dto); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) { return this.workSitesService.remove(id); }
}
