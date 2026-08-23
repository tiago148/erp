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
import { MaintenancePlansService } from './maintenance-plans.service';
import { CreateMaintenancePlanDto } from './dto/create-maintenance-plan.dto';
import { UpdateMaintenancePlanDto } from './dto/update-maintenance-plan.dto';

@Controller('maintenance-plans')
@UseGuards(JwtAuthGuard)
export class MaintenancePlansController {
  constructor(
    private readonly maintenancePlansService: MaintenancePlansService,
  ) {}

  @Post() create(@Body() dto: CreateMaintenancePlanDto) {
    return this.maintenancePlansService.create(dto);
  }

  @Get() findAll(
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
  ) {
    return this.maintenancePlansService.findAll(targetType, targetId);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.maintenancePlansService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenancePlanDto,
  ) {
    return this.maintenancePlansService.update(id, dto);
  }

  @Post(':id/mark-serviced') markServiced(@Param('id') id: string) {
    return this.maintenancePlansService.markServiced(id);
  }

  @Delete(':id') remove(@Param('id') id: string) {
    return this.maintenancePlansService.remove(id);
  }
}
