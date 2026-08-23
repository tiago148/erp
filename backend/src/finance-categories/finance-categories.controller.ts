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
import { FinanceCategoriesService } from './finance-categories.service';
import { CreateFinanceCategoryDto } from './dto/create-finance-category.dto';
import { UpdateFinanceCategoryDto } from './dto/update-finance-category.dto';

@Controller('finance/categories')
@UseGuards(JwtAuthGuard)
export class FinanceCategoriesController {
  constructor(
    private readonly financeCategoriesService: FinanceCategoriesService,
  ) {}

  @Post() create(@Body() dto: CreateFinanceCategoryDto) {
    return this.financeCategoriesService.create(dto);
  }

  @Get() findAll(@Query('type') type?: string) {
    return this.financeCategoriesService.findAll(type);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.financeCategoriesService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateFinanceCategoryDto,
  ) {
    return this.financeCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.financeCategoriesService.remove(id);
  }
}
