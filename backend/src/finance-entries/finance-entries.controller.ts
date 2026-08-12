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
import { FinanceEntriesService } from './finance-entries.service';
import { CreateFinanceEntryDto } from './dto/create-finance-entry.dto';
import { UpdateFinanceEntryDto } from './dto/update-finance-entry.dto';
import { PayFinanceEntryDto } from './dto/pay-finance-entry.dto';

@Controller('finance/entries')
@UseGuards(JwtAuthGuard)
export class FinanceEntriesController {
  constructor(private readonly financeEntriesService: FinanceEntriesService) {}

  @Post() create(@Body() dto: CreateFinanceEntryDto) {
    return this.financeEntriesService.create(dto);
  }

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.financeEntriesService.findAll({
      type,
      status,
      projectId,
      categoryId,
      search,
    });
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.financeEntriesService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateFinanceEntryDto,
  ) {
    return this.financeEntriesService.update(id, dto);
  }

  @Post(':id/pay') pay(
    @Param('id') id: string,
    @Body() dto: PayFinanceEntryDto,
  ) {
    return this.financeEntriesService.pay(id, dto);
  }

  @Post(':id/cancel') cancel(@Param('id') id: string) {
    return this.financeEntriesService.cancel(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.financeEntriesService.remove(id);
  }
}
