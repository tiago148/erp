import { Module } from '@nestjs/common';
import { ProjectBillingController } from './project-billing.controller';
import { ProjectBillingService } from './project-billing.service';

@Module({
  controllers: [ProjectBillingController],
  providers: [ProjectBillingService],
  exports: [ProjectBillingService],
})
export class ProjectBillingModule {}
