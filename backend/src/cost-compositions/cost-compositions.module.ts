import { Module } from '@nestjs/common';
import { CostCompositionsController } from './cost-compositions.controller';
import { CostCompositionsService } from './cost-compositions.service';

@Module({
  controllers: [CostCompositionsController],
  providers: [CostCompositionsService],
})
export class CostCompositionsModule {}
