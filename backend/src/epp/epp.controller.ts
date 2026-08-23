import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EppService } from './epp.service';
import { CreateEppDto } from './dto/create-epp.dto';
import { UpdateEppDto } from './dto/update-epp.dto';

@Controller('epp')
@UseGuards(JwtAuthGuard)
export class EppController {
  constructor(private readonly eppService: EppService) {}

  @Post() create(@Body() dto: CreateEppDto) { return this.eppService.create(dto); }

  @Get() findAll(@Query('employeeId') employeeId?: string) { return this.eppService.findAll(employeeId); }

  @Get(':id') findOne(@Param('id') id: string) { return this.eppService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEppDto) { return this.eppService.update(id, dto); }

  @Delete(':id') remove(@Param('id') id: string) { return this.eppService.remove(id); }
}
