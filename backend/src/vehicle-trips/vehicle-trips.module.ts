import { Module } from '@nestjs/common';
import { VehicleTripsController } from './vehicle-trips.controller';
import { VehicleTripsService } from './vehicle-trips.service';

@Module({
  controllers: [VehicleTripsController],
  providers: [VehicleTripsService],
})
export class VehicleTripsModule {}
