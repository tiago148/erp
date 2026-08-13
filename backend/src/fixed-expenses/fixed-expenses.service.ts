import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOrCreateCategory } from '../common/finance';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';

@Injectable()
export class FixedExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { financeEntry: true };
  }

  private nextBillDueDate(billDay: number) {
    const now = new Date();
    const due = new Date(now.getFullYear(), now.getMonth(), billDay);
    if (due.getTime() < now.setHours(0, 0, 0, 0)) {
      due.setMonth(due.getMonth() + 1);
    }
    return due;
  }

  async create(dto: CreateFixedExpenseDto) {
    let financeEntryId: string | undefined;
    if (dto.generatesBill && dto.billDay) {
      const category = await getOrCreateCategory(
        this.prisma,
        dto.category,
        'EXPENSE',
      );
      const financeEntry = await this.prisma.client.financeEntry.create({
        data: {
          type: 'EXPENSE',
          description: dto.description,
          categoryId: category.id,
          amount: dto.amount,
          dueDate: this.nextBillDueDate(dto.billDay),
          notes: 'Gerada a partir da despesa fixa mensal.',
        },
      });
      financeEntryId = financeEntry.id;
    }

    return this.prisma.client.fixedExpense.create({
      data: {
        description: dto.description,
        category: dto.category,
        amount: dto.amount,
        type: dto.type,
        generatesBill: dto.generatesBill ?? false,
        billDay: dto.billDay,
        supplierName: dto.supplierName,
        notes: dto.notes,
        financeEntryId,
      },
      include: this.include(),
    });
  }

  findAll() {
    return this.prisma.client.fixedExpense.findMany({
      include: this.include(),
      orderBy: { amount: 'desc' },
    });
  }

  async findOne(id: string) {
    const expense = await this.prisma.client.fixedExpense.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!expense) throw new NotFoundException('Despesa fixa nao encontrada.');
    return expense;
  }

  async update(id: string, dto: UpdateFixedExpenseDto) {
    await this.findOne(id);
    return this.prisma.client.fixedExpense.update({
      where: { id },
      data: {
        description: dto.description,
        category: dto.category,
        amount: dto.amount,
        type: dto.type,
        generatesBill: dto.generatesBill,
        billDay: dto.billDay,
        supplierName: dto.supplierName,
        notes: dto.notes,
      },
      include: this.include(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.fixedExpense.delete({ where: { id } });
  }
}
