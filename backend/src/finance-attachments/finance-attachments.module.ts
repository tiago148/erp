import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { FinanceAttachmentsController } from './finance-attachments.controller';
import { FinanceAttachmentsService } from './finance-attachments.service';

@Module({
  imports: [StorageModule],
  controllers: [FinanceAttachmentsController],
  providers: [FinanceAttachmentsService],
})
export class FinanceAttachmentsModule {}
