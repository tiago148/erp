import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectFinancialAnalysisService } from './project-financial-analysis.service';

@Controller('project-financial-analysis')
@UseGuards(JwtAuthGuard)
export class ProjectFinancialAnalysisController {
  constructor(private readonly service: ProjectFinancialAnalysisService) {}

  @Get()
  getComparison() {
    return this.service.getComparison();
  }

  @Get(':projectId')
  getAnalysis(
    @Param('projectId') projectId: string,
    @Query('discountRatePct') discountRatePct?: string,
  ) {
    return this.service.getAnalysis(
      projectId,
      discountRatePct !== undefined ? Number(discountRatePct) : undefined,
    );
  }
}
