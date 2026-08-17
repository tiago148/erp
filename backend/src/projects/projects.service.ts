import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { BudgetsService } from '../budgets/budgets.service';
import { ProjectBillingService } from '../project-billing/project-billing.service';
import { AuditService, Actor } from '../audit/audit.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetsService: BudgetsService,
    private readonly projectBillingService: ProjectBillingService,
    private readonly auditService: AuditService,
  ) {}

  private include() {
    return {
      client: true,
      workSite: true,
      budget: true,
      responsibleEmployee: true,
    };
  }

  private async generateNumber() {
    const count = await this.prisma.client.project.count();
    return 'PRJ-' + String(count + 1).padStart(4, '0');
  }

  async create(dto: CreateProjectDto) {
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const number = await this.generateNumber();
    let budgetAmount = dto.budgetAmount || 0;
    let clientId = dto.clientId;
    let responsibleEmployeeId = dto.responsibleEmployeeId;

    if (dto.budgetId) {
      const existingProject = await this.prisma.client.project.findUnique({
        where: { budgetId: dto.budgetId },
      });
      if (existingProject)
        throw new BadRequestException(
          'Este orcamento ja possui um projeto vinculado.',
        );

      // Reaproveita BudgetsService.findOne() em vez de recalcular o total
      // aqui: garante que o valor do projeto sempre bata com o preco de
      // venda real do orcamento (formula gross-up do Bloco K), em vez de
      // ficar preso a uma formula antiga baseada em BDI.
      const budget = await this.budgetsService.findOne(dto.budgetId);

      budgetAmount = budget.totals.total;
      clientId = budget.clientId;
      if (!responsibleEmployeeId)
        responsibleEmployeeId = budget.employeeId ?? undefined;
    }

    return this.prisma.client.project.create({
      data: {
        number,
        name: dto.name,
        clientId,
        workSiteId: dto.workSiteId,
        budgetId: dto.budgetId,
        status: dto.status,
        budgetAmount,
        startDate,
        endDate,
        notes: dto.notes,
        responsibleEmployeeId,
      },
      include: this.include(),
    });
  }

  findAll(search?: string) {
    return this.prisma.client.project.findMany({
      where: search
        ? {
            OR: [
              { number: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { client: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.client.project.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!project) throw new NotFoundException('Projeto nao encontrado.');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, actor?: Actor) {
    const existing = await this.findOne(id);

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    const project = await this.prisma.client.project.update({
      where: { id },
      data,
      include: this.include(),
    });

    const justCompleted =
      (dto.status as string) === 'COMPLETED' &&
      (existing.status as string) !== 'COMPLETED';
    if (justCompleted) {
      await this.autoInvoiceRemaining(project, actor);
    }

    return project;
  }

  // Ao concluir uma obra, fatura automaticamente o saldo do valor do
  // orcamento que ainda nao tinha sido faturado manualmente — sem isso,
  // concluir a obra nao gerava nenhum lancamento financeiro, e o usuario
  // via "o dinheiro nao entrou" mesmo apos terminar o trabalho.
  private async autoInvoiceRemaining(project: any, actor?: Actor) {
    const invoicedItems = await this.prisma.client.projectBillingItem.findMany({
      where: { projectId: project.id, status: 'INVOICED' },
    });
    const alreadyInvoiced = invoicedItems.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const remaining = round2(Number(project.budgetAmount) - alreadyInvoiced);
    if (remaining <= 0.01) return;

    const item = await this.projectBillingService.create({
      projectId: project.id,
      description: `Faturamento automático — conclusão da obra ${project.number}`,
      amount: remaining,
      plannedDate: new Date().toISOString(),
    });
    await this.projectBillingService.invoice(item.id);

    await this.auditService.log({
      actor,
      action: 'PROJECT_AUTO_BILLING',
      entity: 'Project',
      entityId: project.id,
      details: `Obra ${project.number} concluída: faturamento automático de ${remaining} gerado.`,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.project.delete({ where: { id } });
  }
}
