import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post() create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  // Manutencao unica para projetos criados antes do Previsto x Realizado --
  // ver ProjectsService.backfillPlannedCosts().
  @Post('backfill-planned-costs')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  backfillPlannedCosts() {
    return this.projectsService.backfillPlannedCosts();
  }

  @Get() findAll(@Query('search') search?: string) {
    return this.projectsService.findAll(search);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: any,
  ) {
    return this.projectsService.update(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
