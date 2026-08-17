import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { BudgetsModule } from '../budgets/budgets.module';
import { ProjectBillingModule } from '../project-billing/project-billing.module';

@Module({
  imports: [BudgetsModule, ProjectBillingModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
