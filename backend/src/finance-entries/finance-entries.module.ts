import { Module } from '@nestjs/common';
import { FinanceEntriesController } from './finance-entries.controller';
import { FinanceEntriesService } from './finance-entries.service';

@Module({
  controllers: [FinanceEntriesController],
  providers: [FinanceEntriesService],
})
export class FinanceEntriesModule {}
