import { Module } from '@nestjs/common';
import { PrevistoRealizadoController } from './previsto-realizado.controller';
import { PrevistoRealizadoService } from './previsto-realizado.service';

@Module({
  controllers: [PrevistoRealizadoController],
  providers: [PrevistoRealizadoService],
  exports: [PrevistoRealizadoService],
})
export class PrevistoRealizadoModule {}
