import { Module } from '@nestjs/common';
import { LessonsLearnedController } from './lessons-learned.controller';
import { LessonsLearnedService } from './lessons-learned.service';

@Module({
  controllers: [LessonsLearnedController],
  providers: [LessonsLearnedService],
})
export class LessonsLearnedModule {}
