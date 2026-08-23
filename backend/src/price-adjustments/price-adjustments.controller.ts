import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PriceAdjustmentsService } from './price-adjustments.service';
import { CreatePriceAdjustmentDto } from './dto/create-price-adjustment.dto';

@Controller('price-adjustments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PriceAdjustmentsController {
  constructor(
    private readonly priceAdjustmentsService: PriceAdjustmentsService,
  ) {}

  @Post() create(@Body() dto: CreatePriceAdjustmentDto, @Req() req: any) {
    return this.priceAdjustmentsService.create(dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Get() findAll() {
    return this.priceAdjustmentsService.findAll();
  }
}
