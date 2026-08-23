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
import { ToolMaintenancesService } from './tool-maintenances.service';
import { CreateToolMaintenanceDto } from './dto/create-tool-maintenance.dto';
import { UpdateToolMaintenanceDto } from './dto/update-tool-maintenance.dto';

@Controller('tool-maintenances')
@UseGuards(JwtAuthGuard)
export class ToolMaintenancesController {
  constructor(
    private readonly toolMaintenancesService: ToolMaintenancesService,
  ) {}

  @Post() create(@Body() dto: CreateToolMaintenanceDto) {
    return this.toolMaintenancesService.create(dto);
  }

  @Get() findAll(@Query('toolId') toolId?: string) {
    return this.toolMaintenancesService.findAll(toolId);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.toolMaintenancesService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateToolMaintenanceDto,
  ) {
    return this.toolMaintenancesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.toolMaintenancesService.remove(id);
  }
}
