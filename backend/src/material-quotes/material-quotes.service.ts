import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateQuoteLandedCost,
  getQuoteConfidence,
} from '../common/material-price';
import { CreateMaterialQuoteDto } from './dto/create-material-quote.dto';
import { UpdateMaterialQuoteDto } from './dto/update-material-quote.dto';

function withDerivedFields(quote: any) {
  const landedCost = calculateQuoteLandedCost({
    id: quote.id,
    price: Number(quote.price),
    quantity: Number(quote.quantity),
    freight: Number(quote.freight),
    freightModality: quote.freightModality,
    validUntil: quote.validUntil,
  });
  return {
    ...quote,
    landedCost: Math.round(landedCost * 100) / 100,
    confidence: getQuoteConfidence(quote.validUntil),
  };
}

@Injectable()
export class MaterialQuotesService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return { supplier: true };
  }

  async create(dto: CreateMaterialQuoteDto) {
    const material = await this.prisma.client.material.findUnique({
      where: { id: dto.materialId },
    });
    if (!material) throw new NotFoundException('Material nao encontrado.');

    const quote = await this.prisma.client.materialQuote.create({
      data: {
        materialId: dto.materialId,
        supplierId: dto.supplierId,
        price: dto.price,
        quantity: dto.quantity,
        freight: dto.freight,
        freightModality: dto.freightModality,
        validUntil: new Date(dto.validUntil),
        notes: dto.notes,
      },
      include: this.include(),
    });
    return withDerivedFields(quote);
  }

  async findAll(materialId?: string) {
    const quotes = await this.prisma.client.materialQuote.findMany({
      where: materialId ? { materialId } : undefined,
      include: this.include(),
      orderBy: { validUntil: 'desc' },
    });
    return quotes.map(withDerivedFields);
  }

  async findOne(id: string) {
    const quote = await this.prisma.client.materialQuote.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!quote) throw new NotFoundException('Cotacao nao encontrada.');
    return withDerivedFields(quote);
  }

  async update(id: string, dto: UpdateMaterialQuoteDto) {
    await this.findOne(id);
    const quote = await this.prisma.client.materialQuote.update({
      where: { id },
      data: {
        ...dto,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
      include: this.include(),
    });
    return withDerivedFields(quote);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.materialQuote.delete({ where: { id } });
  }
}
