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
import { ProjectBillingService } from './project-billing.service';
import { CreateProjectBillingItemDto } from './dto/create-project-billing-item.dto';
import { UpdateProjectBillingItemDto } from './dto/update-project-billing-item.dto';

@Controller('project-billing')
@UseGuards(JwtAuthGuard)
export class ProjectBillingController {
  constructor(private readonly projectBillingService: ProjectBillingService) {}

  @Post() create(@Body() dto: CreateProjectBillingItemDto) {
    return this.projectBillingService.create(dto);
  }

  @Get() findAll(@Query('projectId') projectId?: string) {
    return this.projectBillingService.findAll(projectId);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.projectBillingService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectBillingItemDto,
  ) {
    return this.projectBillingService.update(id, dto);
  }

  @Post(':id/invoice') invoice(@Param('id') id: string) {
    return this.projectBillingService.invoice(id);
  }

  @Post(':id/cancel') cancel(@Param('id') id: string) {
    return this.projectBillingService.cancel(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.projectBillingService.remove(id);
  }
}
