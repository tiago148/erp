import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CyclicCountsService } from './cyclic-counts.service';
import { CreateCyclicCountDto } from './dto/create-cyclic-count.dto';

@Controller('cyclic-counts')
@UseGuards(JwtAuthGuard)
export class CyclicCountsController {
  constructor(private readonly service: CyclicCountsService) {}

  @Get() findAll() {
    return this.service.findAll();
  }

  @Get('plan') plan() {
    return this.service.plan();
  }

  @Post() create(@Body() dto: CreateCyclicCountDto, @Req() req: any) {
    return this.service.create(dto, { userId: req.user.userId, email: req.user.email });
  }
}
