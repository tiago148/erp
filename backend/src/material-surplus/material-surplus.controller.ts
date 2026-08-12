import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MaterialSurplusService } from './material-surplus.service';
import { CreateMaterialSurplusDto } from './dto/create-material-surplus.dto';

@Controller('material-surpluses')
@UseGuards(JwtAuthGuard)
export class MaterialSurplusController {
  constructor(
    private readonly materialSurplusService: MaterialSurplusService,
  ) {}

  @Post() create(@Body() dto: CreateMaterialSurplusDto) {
    return this.materialSurplusService.create(dto);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ) {
    return this.materialSurplusService.findAll({ projectId, status });
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.materialSurplusService.findOne(id);
  }

  @Post(':id/return-to-stock') returnToStock(@Param('id') id: string) {
    return this.materialSurplusService.returnToStock(id);
  }

  @Post(':id/keep-at-project') keepAtProject(@Param('id') id: string) {
    return this.materialSurplusService.keepAtProject(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.materialSurplusService.remove(id);
  }
}
