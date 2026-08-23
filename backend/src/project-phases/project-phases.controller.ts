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
import { ProjectPhasesService } from './project-phases.service';
import { CreateProjectPhaseDto } from './dto/create-project-phase.dto';
import { UpdateProjectPhaseDto } from './dto/update-project-phase.dto';

@Controller('project-phases')
@UseGuards(JwtAuthGuard)
export class ProjectPhasesController {
  constructor(private readonly projectPhasesService: ProjectPhasesService) {}

  @Post() create(@Body() dto: CreateProjectPhaseDto) {
    return this.projectPhasesService.create(dto);
  }

  @Get() findAll(@Query('projectId') projectId?: string) {
    return this.projectPhasesService.findAll(projectId);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.projectPhasesService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectPhaseDto,
  ) {
    return this.projectPhasesService.update(id, dto);
  }

  @Delete(':id') remove(@Param('id') id: string) {
    return this.projectPhasesService.remove(id);
  }
}
