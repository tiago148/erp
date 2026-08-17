import { Module } from '@nestjs/common';
import { MaterialQuotesController } from './material-quotes.controller';
import { MaterialQuotesService } from './material-quotes.service';

@Module({
  controllers: [MaterialQuotesController],
  providers: [MaterialQuotesService],
})
export class MaterialQuotesModule {}
