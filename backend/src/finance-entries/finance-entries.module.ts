import { Module } from '@nestjs/common';
import { FinanceAccountsModule } from '../finance-accounts/finance-accounts.module';
import { FinanceClosuresModule } from '../finance-closures/finance-closures.module';
import { FinanceEntriesController } from './finance-entries.controller';
import { FinanceEntriesService } from './finance-entries.service';

@Module({
  imports: [FinanceAccountsModule, FinanceClosuresModule],
  controllers: [FinanceEntriesController],
  providers: [FinanceEntriesService],
})
export class FinanceEntriesModule {}
