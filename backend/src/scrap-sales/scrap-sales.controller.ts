import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScrapSalesService } from './scrap-sales.service';
import { CreateScrapSaleDto } from './dto/create-scrap-sale.dto';

@Controller('scrap-sales')
@UseGuards(JwtAuthGuard)
export class ScrapSalesController {
  constructor(private readonly scrapSalesService: ScrapSalesService) {}

  @Post() create(@Body() dto: CreateScrapSaleDto) {
    return this.scrapSalesService.create(dto);
  }

  @Get() findAll() {
    return this.scrapSalesService.findAll();
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.scrapSalesService.findOne(id);
  }
}
