import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReconciliationService } from './reconciliation.service';

@Controller('reconciliation')
@UseGuards(JwtAuthGuard)
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Get()
  get(@Query('period') period?: 'mes' | '3m' | 'ano') {
    return this.service.get(period ?? 'ano');
  }
}
