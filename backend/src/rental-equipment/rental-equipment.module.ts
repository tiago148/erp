import { Module } from '@nestjs/common';
import { RentalEquipmentController } from './rental-equipment.controller';
import { RentalEquipmentService } from './rental-equipment.service';

@Module({
  controllers: [RentalEquipmentController],
  providers: [RentalEquipmentService],
  exports: [RentalEquipmentService],
})
export class RentalEquipmentModule {}
