import { Module } from '@nestjs/common';
import { FixedExpensesController } from './fixed-expenses.controller';
import { FixedExpensesService } from './fixed-expenses.service';

@Module({
  controllers: [FixedExpensesController],
  providers: [FixedExpensesService],
})
export class FixedExpensesModule {}
