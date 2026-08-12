import { Module } from '@nestjs/common';
import { ProjectBillingController } from './project-billing.controller';
import { ProjectBillingService } from './project-billing.service';

@Module({
  controllers: [ProjectBillingController],
  providers: [ProjectBillingService],
})
export class ProjectBillingModule {}
