import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentTargetType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDocumentDto) {
    return this.prisma.client.trackedDocument.create({
      data: {
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }

  findAll(targetType?: DocumentTargetType) {
    return this.prisma.client.trackedDocument.findMany({
      where: targetType ? { targetType } : undefined,
      orderBy: { expiresAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.client.trackedDocument.findUnique({
      where: { id },
    });
    if (!document) throw new NotFoundException('Documento nao encontrado.');
    return document;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    await this.findOne(id);
    return this.prisma.client.trackedDocument.update({
      where: { id },
      data: {
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.trackedDocument.delete({ where: { id } });
  }
}
