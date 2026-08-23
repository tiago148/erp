import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StockService } from './stock.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post() create(@Body() dto: CreateStockItemDto) { return this.stockService.create(dto); }

  @Get() findAll(@Query('search') search?: string) { return this.stockService.findAll(search); }

  @Get(':id') findOne(@Param('id') id: string) { return this.stockService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateStockItemDto) { return this.stockService.update(id, dto); }

  @Post(':id/movements') addMovement(@Param('id') id: string, @Body() dto: CreateStockMovementDto) {
    return this.stockService.addMovement(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) { return this.stockService.remove(id); }
}
