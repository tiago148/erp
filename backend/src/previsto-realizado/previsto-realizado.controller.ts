import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrevistoRealizadoService } from './previsto-realizado.service';

@Controller('previsto-realizado')
@UseGuards(JwtAuthGuard)
export class PrevistoRealizadoController {
  constructor(
    private readonly previstoRealizadoService: PrevistoRealizadoService,
  ) {}

  @Get('projects') getPortfolio() {
    return this.previstoRealizadoService.getPortfolio();
  }

  @Get('projects/:id') getForProject(@Param('id') id: string) {
    return this.previstoRealizadoService.getForProject(id);
  }
}
