import { Module } from '@nestjs/common';
import { FinanceImportController } from './finance-import.controller';
import { FinanceImportService } from './finance-import.service';

@Module({
  controllers: [FinanceImportController],
  providers: [FinanceImportService],
})
export class FinanceImportModule {}
