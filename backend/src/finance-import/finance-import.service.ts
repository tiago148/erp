import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';

export interface ImportMapping {
  hasHeaderRow: boolean;
  dateColumnIndex: number;
  descriptionColumnIndex: number;
  amountColumnIndex: number;
  incomeCategoryId: string;
  expenseCategoryId: string;
}

function detectDelimiter(sample: string) {
  const firstLine = sample.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

const BOM = String.fromCharCode(0xfeff);

function parseCsv(buffer: Buffer): string[][] {
  const text = buffer.toString('utf-8').replace(new RegExp('^' + BOM), '');
  const delimiter = detectDelimiter(text);
  return parse(text, {
    delimiter,
    relax_column_count: true,
    skip_empty_lines: true,
  });
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/[R$\s]/g, '');
  if (!cleaned) return null;
  let normalized = cleaned;
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  if (hasComma && hasDot) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = normalized.replace(',', '.');
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseDate(raw: string): Date | null {
  const s = raw.trim();
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return null;
}

@Injectable()
export class FinanceImportService {
  constructor(private readonly prisma: PrismaService) {}

  preview(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    const rows = parseCsv(file.buffer);
    if (rows.length === 0) throw new BadRequestException('Arquivo CSV vazio.');
    return {
      totalRows: rows.length,
      columnCount: rows[0].length,
      rows: rows.slice(0, 20),
    };
  }

  async import(file: Express.Multer.File | undefined, mapping: ImportMapping) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    if (!mapping)
      throw new BadRequestException('Mapeamento de colunas ausente.');

    const {
      dateColumnIndex,
      descriptionColumnIndex,
      amountColumnIndex,
      incomeCategoryId,
      expenseCategoryId,
    } = mapping;

    if (
      [dateColumnIndex, descriptionColumnIndex, amountColumnIndex].some(
        (i) => i === undefined || i === null || i < 0,
      )
    ) {
      throw new BadRequestException('Mapeamento de colunas incompleto.');
    }
    if (!incomeCategoryId || !expenseCategoryId) {
      throw new BadRequestException(
        'Selecione a categoria de receita e a categoria de despesa.',
      );
    }

    const [incomeCategory, expenseCategory] = await Promise.all([
      this.prisma.client.financeCategory.findUnique({
        where: { id: incomeCategoryId },
      }),
      this.prisma.client.financeCategory.findUnique({
        where: { id: expenseCategoryId },
      }),
    ]);
    if (!incomeCategory || incomeCategory.type !== 'INCOME') {
      throw new BadRequestException('Categoria de receita invalida.');
    }
    if (!expenseCategory || expenseCategory.type !== 'EXPENSE') {
      throw new BadRequestException('Categoria de despesa invalida.');
    }

    const rows = parseCsv(file.buffer);
    const dataRows = mapping.hasHeaderRow ? rows.slice(1) : rows;

    const toCreate: {
      type: 'INCOME' | 'EXPENSE';
      description: string;
      categoryId: string;
      amount: number;
      dueDate: Date;
      paidAt: Date;
      paidAmount: number;
      status: 'PAID';
    }[] = [];
    const skipped: { row: number; reason: string }[] = [];

    dataRows.forEach((row, idx) => {
      const rowNumber = idx + (mapping.hasHeaderRow ? 2 : 1);
      if (row.every((c) => !c || !c.trim())) return;

      const rawDate = row[dateColumnIndex];
      const rawDescription = row[descriptionColumnIndex];
      const rawAmount = row[amountColumnIndex];

      const date = rawDate ? parseDate(rawDate) : null;
      if (!date) {
        skipped.push({
          row: rowNumber,
          reason: `Data invalida: "${rawDate ?? ''}"`,
        });
        return;
      }

      const amount = rawAmount ? parseAmount(rawAmount) : null;
      if (amount === null) {
        skipped.push({
          row: rowNumber,
          reason: `Valor invalido: "${rawAmount ?? ''}"`,
        });
        return;
      }
      if (amount === 0) {
        skipped.push({ row: rowNumber, reason: 'Valor zero, ignorado.' });
        return;
      }

      const type = amount > 0 ? 'INCOME' : 'EXPENSE';
      const categoryId =
        type === 'INCOME' ? incomeCategoryId : expenseCategoryId;
      const description = (rawDescription || '').trim() || 'Importado via CSV';

      toCreate.push({
        type,
        description,
        categoryId,
        amount: Math.abs(amount),
        dueDate: date,
        paidAt: date,
        paidAmount: Math.abs(amount),
        status: 'PAID',
      });
    });

    if (toCreate.length > 0) {
      await this.prisma.client.financeEntry.createMany({ data: toCreate });
    }

    return { imported: toCreate.length, skipped };
  }
}
