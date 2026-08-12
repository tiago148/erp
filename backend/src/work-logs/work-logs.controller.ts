import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkLogsService } from './work-logs.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';

@Controller('work-logs')
@UseGuards(JwtAuthGuard)
export class WorkLogsController {
  constructor(private readonly workLogsService: WorkLogsService) {}

  @Post() create(@Body() dto: CreateWorkLogDto) {
    return this.workLogsService.create(dto);
  }

  @Get() findAll(@Query('projectId') projectId?: string) {
    return this.workLogsService.findAll(projectId);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.workLogsService.findOne(id);
  }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateWorkLogDto) {
    return this.workLogsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.workLogsService.remove(id);
  }
}
