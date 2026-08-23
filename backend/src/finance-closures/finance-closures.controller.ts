import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FinanceClosuresService } from './finance-closures.service';
import { CloseFinanceClosureDto } from './dto/close-finance-closure.dto';
import { ReopenFinanceClosureDto } from './dto/reopen-finance-closure.dto';

@Controller('finance-closures')
@UseGuards(JwtAuthGuard)
export class FinanceClosuresController {
  constructor(
    private readonly financeClosuresService: FinanceClosuresService,
  ) {}

  @Get('current')
  current(
    @Query('accountId') accountId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodType') periodType: string | undefined,
    @Req() req: any,
  ) {
    if (!accountId || !periodStart) {
      throw new BadRequestException(
        'accountId e periodStart sao obrigatorios.',
      );
    }
    return this.financeClosuresService.getOrCreateCurrent(
      accountId,
      periodType || 'DAILY',
      new Date(periodStart),
      { userId: req.user.userId, email: req.user.email },
    );
  }

  @Get() findAll(@Query('accountId') accountId?: string) {
    return this.financeClosuresService.findAll(accountId);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.financeClosuresService.findOne(id);
  }

  @Post(':id/start-review') startReview(@Param('id') id: string) {
    return this.financeClosuresService.startReview(id);
  }

  @Post(':id/close') close(
    @Param('id') id: string,
    @Body() dto: CloseFinanceClosureDto,
    @Req() req: any,
  ) {
    return this.financeClosuresService.close(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Post(':id/reopen')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  reopen(
    @Param('id') id: string,
    @Body() dto: ReopenFinanceClosureDto,
    @Req() req: any,
  ) {
    return this.financeClosuresService.reopen(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }
}
