import { Module } from '@nestjs/common';
import { ClientContactsController } from './client-contacts.controller';
import { ClientContactsService } from './client-contacts.service';

@Module({
  controllers: [ClientContactsController],
  providers: [ClientContactsService],
})
export class ClientContactsModule {}
