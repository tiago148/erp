import { Module } from '@nestjs/common';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';
import { PrevistoRealizadoModule } from '../previsto-realizado/previsto-realizado.module';

@Module({
  imports: [PrevistoRealizadoModule],
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
})
export class ReconciliationModule {}
