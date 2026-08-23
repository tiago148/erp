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
import { VehicleMaintenancesService } from './vehicle-maintenances.service';
import { CreateVehicleMaintenanceDto } from './dto/create-vehicle-maintenance.dto';
import { UpdateVehicleMaintenanceDto } from './dto/update-vehicle-maintenance.dto';

@Controller('vehicle-maintenances')
@UseGuards(JwtAuthGuard)
export class VehicleMaintenancesController {
  constructor(
    private readonly vehicleMaintenancesService: VehicleMaintenancesService,
  ) {}

  @Post() create(@Body() dto: CreateVehicleMaintenanceDto) {
    return this.vehicleMaintenancesService.create(dto);
  }

  @Get() findAll(@Query('vehicleId') vehicleId?: string) {
    return this.vehicleMaintenancesService.findAll(vehicleId);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.vehicleMaintenancesService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleMaintenanceDto,
  ) {
    return this.vehicleMaintenancesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.vehicleMaintenancesService.remove(id);
  }
}
