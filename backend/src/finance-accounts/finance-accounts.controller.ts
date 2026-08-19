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
import { FinanceAccountsService } from './finance-accounts.service';
import { CreateFinanceAccountDto } from './dto/create-finance-account.dto';
import { UpdateFinanceAccountDto } from './dto/update-finance-account.dto';

@Controller('finance-accounts')
@UseGuards(JwtAuthGuard)
export class FinanceAccountsController {
  constructor(
    private readonly financeAccountsService: FinanceAccountsService,
  ) {}

  @Post() create(@Body() dto: CreateFinanceAccountDto, @Req() req: any) {
    return this.financeAccountsService.create(dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Get() findAll() {
    return this.financeAccountsService.findAll();
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.financeAccountsService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateFinanceAccountDto,
    @Req() req: any,
  ) {
    return this.financeAccountsService.update(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.financeAccountsService.remove(id, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }
}
