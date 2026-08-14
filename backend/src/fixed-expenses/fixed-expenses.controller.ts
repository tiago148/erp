import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FixedExpensesService } from './fixed-expenses.service';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';

@Controller('fixed-expenses')
@UseGuards(JwtAuthGuard)
export class FixedExpensesController {
  constructor(private readonly fixedExpensesService: FixedExpensesService) {}

  @Post() create(@Body() dto: CreateFixedExpenseDto, @Req() req: any) {
    return this.fixedExpensesService.create(dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Get() findAll() {
    return this.fixedExpensesService.findAll();
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.fixedExpensesService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateFixedExpenseDto,
    @Req() req: any,
  ) {
    return this.fixedExpensesService.update(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.fixedExpensesService.remove(id, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }
}
