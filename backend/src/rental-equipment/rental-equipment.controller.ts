import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RentalEquipmentService } from './rental-equipment.service';
import { CreateRentalEquipmentDto } from './dto/create-rental-equipment.dto';
import { UpdateRentalEquipmentDto } from './dto/update-rental-equipment.dto';
import { BulkAdjustPriceDto } from './dto/bulk-adjust-price.dto';

@Controller('rental-equipment')
@UseGuards(JwtAuthGuard)
export class RentalEquipmentController {
  constructor(
    private readonly rentalEquipmentService: RentalEquipmentService,
  ) {}

  @Post()
  create(@Body() dto: CreateRentalEquipmentDto) {
    return this.rentalEquipmentService.create(dto);
  }

  @Post('bulk-adjust-price')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  bulkAdjustPrice(@Body() dto: BulkAdjustPriceDto) {
    return this.rentalEquipmentService.bulkAdjustPrice(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.rentalEquipmentService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rentalEquipmentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRentalEquipmentDto) {
    return this.rentalEquipmentService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.rentalEquipmentService.remove(id);
  }
}
