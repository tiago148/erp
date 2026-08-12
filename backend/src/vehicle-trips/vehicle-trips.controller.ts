import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VehicleTripsService } from './vehicle-trips.service';
import { CreateVehicleTripDto } from './dto/create-vehicle-trip.dto';

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
}
