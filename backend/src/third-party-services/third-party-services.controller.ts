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
import { ThirdPartyServicesService } from './third-party-services.service';
import { CreateThirdPartyServiceDto } from './dto/create-third-party-service.dto';
import { UpdateThirdPartyServiceDto } from './dto/update-third-party-service.dto';
import { BulkAdjustPriceDto } from './dto/bulk-adjust-price.dto';

@Controller('third-party-services')
@UseGuards(JwtAuthGuard)
export class ThirdPartyServicesController {
  constructor(
    private readonly thirdPartyServicesService: ThirdPartyServicesService,
  ) {}

  @Post()
  create(@Body() dto: CreateThirdPartyServiceDto) {
    return this.thirdPartyServicesService.create(dto);
  }

  @Post('bulk-adjust-price')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  bulkAdjustPrice(@Body() dto: BulkAdjustPriceDto) {
    return this.thirdPartyServicesService.bulkAdjustPrice(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.thirdPartyServicesService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.thirdPartyServicesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateThirdPartyServiceDto) {
    return this.thirdPartyServicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.thirdPartyServicesService.remove(id);
  }
}
