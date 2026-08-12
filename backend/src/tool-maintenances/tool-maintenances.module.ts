import { Module } from '@nestjs/common';
import { ToolMaintenancesController } from './tool-maintenances.controller';
import { ToolMaintenancesService } from './tool-maintenances.service';

@Module({
  controllers: [ToolMaintenancesController],
  providers: [ToolMaintenancesService],
})
export class ToolMaintenancesModule {}
