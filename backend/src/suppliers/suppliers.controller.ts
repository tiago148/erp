import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post() create(@Body() dto: CreateSupplierDto) { return this.suppliersService.create(dto); }

  @Get() findAll(@Query('search') search?: string) { return this.suppliersService.findAll(search); }

  @Get(':id') findOne(@Param('id') id: string) { return this.suppliersService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) { return this.suppliersService.update(id, dto); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) { return this.suppliersService.remove(id); }
}
