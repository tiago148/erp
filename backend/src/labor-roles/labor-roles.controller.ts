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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LaborRolesService } from './labor-roles.service';
import { CreateLaborRoleDto } from './dto/create-labor-role.dto';
import { UpdateLaborRoleDto } from './dto/update-labor-role.dto';
import { BulkAdjustPriceDto } from './dto/bulk-adjust-price.dto';

@Controller('labor-roles')
@UseGuards(JwtAuthGuard)
export class LaborRolesController {
  constructor(private readonly laborRolesService: LaborRolesService) {}

  @Post()
  create(@Body() dto: CreateLaborRoleDto) {
    return this.laborRolesService.create(dto);
  }

  @Post('bulk-adjust-price')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  bulkAdjustPrice(@Body() dto: BulkAdjustPriceDto) {
    return this.laborRolesService.bulkAdjustPrice(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.laborRolesService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.laborRolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLaborRoleDto) {
    return this.laborRolesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.laborRolesService.remove(id);
  }
}
