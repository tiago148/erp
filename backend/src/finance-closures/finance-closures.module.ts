import { Module } from '@nestjs/common';
import { FinanceClosuresController } from './finance-closures.controller';
import { FinanceClosuresService } from './finance-closures.service';

@Module({
  controllers: [FinanceClosuresController],
  providers: [FinanceClosuresService],
  exports: [FinanceClosuresService],
})
export class FinanceClosuresModule {}
