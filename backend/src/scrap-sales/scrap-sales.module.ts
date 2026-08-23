import { Module } from '@nestjs/common';
import { ScrapSalesController } from './scrap-sales.controller';
import { ScrapSalesService } from './scrap-sales.service';

@Module({
  controllers: [ScrapSalesController],
  providers: [ScrapSalesService],
})
export class ScrapSalesModule {}
