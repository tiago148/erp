import { Module } from '@nestjs/common';
import { DdsController } from './dds.controller';
import { DdsService } from './dds.service';

@Module({
  controllers: [DdsController],
  providers: [DdsService],
})
export class DdsModule {}
