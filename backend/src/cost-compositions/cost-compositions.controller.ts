import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CostCompositionsService } from './cost-compositions.service';
import { CreateCostCompositionDto } from './dto/create-cost-composition.dto';
import { UpdateCostCompositionDto } from './dto/update-cost-composition.dto';

@Controller('cost-compositions')
@UseGuards(JwtAuthGuard)
export class CostCompositionsController {
  constructor(
    private readonly costCompositionsService: CostCompositionsService,
  ) {}

  @Post() create(@Body() dto: CreateCostCompositionDto) {
    return this.costCompositionsService.create(dto);
  }

  @Get() findAll() {
    return this.costCompositionsService.findAll();
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.costCompositionsService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateCostCompositionDto,
  ) {
    return this.costCompositionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.costCompositionsService.remove(id);
  }
}
