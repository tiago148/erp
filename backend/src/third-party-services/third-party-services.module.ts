import { Module } from '@nestjs/common';
import { ThirdPartyServicesController } from './third-party-services.controller';
import { ThirdPartyServicesService } from './third-party-services.service';

@Module({
  controllers: [ThirdPartyServicesController],
  providers: [ThirdPartyServicesService],
  exports: [ThirdPartyServicesService],
})
export class ThirdPartyServicesModule {}
