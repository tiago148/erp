import { Module } from '@nestjs/common';
import { VehicleMaintenancesController } from './vehicle-maintenances.controller';
import { VehicleMaintenancesService } from './vehicle-maintenances.service';

@Module({
  controllers: [VehicleMaintenancesController],
  providers: [VehicleMaintenancesService],
})
export class VehicleMaintenancesModule {}
