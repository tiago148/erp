import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post() create(@Body() dto: CreatePurchaseOrderDto) { return this.purchaseOrdersService.create(dto); }

  @Get() findAll(@Query('search') search?: string) { return this.purchaseOrdersService.findAll(search); }

  @Get(':id') findOne(@Param('id') id: string) { return this.purchaseOrdersService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) { return this.purchaseOrdersService.update(id, dto); }

  @Post(':id/receive') receive(@Param('id') id: string) { return this.purchaseOrdersService.receive(id); }

  @Post(':id/cancel') cancel(@Param('id') id: string) { return this.purchaseOrdersService.cancel(id); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) { return this.purchaseOrdersService.remove(id); }
}
