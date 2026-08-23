import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
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
import { BudgetsService } from './budgets.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(
    private readonly budgetsService: BudgetsService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  create(@Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.budgetsService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgetsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @Req() req: any,
  ) {
    const actor = { userId: req.user.userId, email: req.user.email };
    const wasApproved =
      (await this.budgetsService.findOne(id)).status === 'APPROVED';
    const budget = await this.budgetsService.update(id, dto, actor);

    // Aprovar um orcamento vira projeto automaticamente -- sem precisar do
    // fluxo manual "Novo Projeto > Origem: Orcamento".
    if (dto.status === 'APPROVED' && !wasApproved) {
      await this.projectsService.createFromApprovedBudget(id, actor);
    }

    return budget;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.budgetsService.remove(id, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.budgetsService.duplicate(id);
  }

  @Post(':id/new-version')
  createNewVersion(@Param('id') id: string) {
    return this.budgetsService.createNewVersion(id);
  }

  @Get(':id/versions')
  findVersions(@Param('id') id: string) {
    return this.budgetsService.findVersions(id);
  }
}
