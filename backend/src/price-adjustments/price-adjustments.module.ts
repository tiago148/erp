import { Module } from '@nestjs/common';
import { PriceAdjustmentsController } from './price-adjustments.controller';
import { PriceAdjustmentsService } from './price-adjustments.service';

@Module({
  controllers: [PriceAdjustmentsController],
  providers: [PriceAdjustmentsService],
})
export class PriceAdjustmentsModule {}
