import { Module } from '@nestjs/common';
import { EppController } from './epp.controller';
import { EppService } from './epp.service';

@Module({
  controllers: [EppController],
  providers: [EppService],
})
export class EppModule {}
