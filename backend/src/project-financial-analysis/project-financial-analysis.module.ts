import { Module } from '@nestjs/common';
import { ProjectFinancialAnalysisController } from './project-financial-analysis.controller';
import { ProjectFinancialAnalysisService } from './project-financial-analysis.service';
import { PrevistoRealizadoModule } from '../previsto-realizado/previsto-realizado.module';

@Module({
  imports: [PrevistoRealizadoModule],
  controllers: [ProjectFinancialAnalysisController],
  providers: [ProjectFinancialAnalysisService],
})
export class ProjectFinancialAnalysisModule {}
