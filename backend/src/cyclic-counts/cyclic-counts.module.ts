import { Module } from '@nestjs/common';
import { CyclicCountsController } from './cyclic-counts.controller';
import { CyclicCountsService } from './cyclic-counts.service';

@Module({
  controllers: [CyclicCountsController],
  providers: [CyclicCountsService],
})
export class CyclicCountsModule {}
