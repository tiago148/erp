import { Module } from '@nestjs/common';
import { MaterialSurplusController } from './material-surplus.controller';
import { MaterialSurplusService } from './material-surplus.service';

@Module({
  controllers: [MaterialSurplusController],
  providers: [MaterialSurplusService],
})
export class MaterialSurplusModule {}
