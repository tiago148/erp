import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VehicleTripsService } from './vehicle-trips.service';
import { CreateVehicleTripDto } from './dto/create-vehicle-trip.dto';
import { CloseVehicleTripDto } from './dto/close-vehicle-trip.dto';

@Controller('vehicle-trips')
@UseGuards(JwtAuthGuard)
export class VehicleTripsController {
  constructor(private readonly vehicleTripsService: VehicleTripsService) {}

  @Post() create(@Body() dto: CreateVehicleTripDto) {
    return this.vehicleTripsService.create(dto);
  }

  @Get() findAll(@Query('vehicleId') vehicleId?: string) {
    return this.vehicleTripsService.findAll(vehicleId);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.vehicleTripsService.findOne(id);
  }

  @Post(':id/close') close(
    @Param('id') id: string,
    @Body() dto: CloseVehicleTripDto,
  ) {
    return this.vehicleTripsService.close(id, dto);
  }

  @Delete(':id') remove(@Param('id') id: string) {
    return this.vehicleTripsService.remove(id);
  }
}
