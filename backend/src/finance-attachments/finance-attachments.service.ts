import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class FinanceAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async withUrl(attachment: any) {
    const url = await this.storage.getSignedUrl(attachment.storagePath);
    return { ...attachment, url };
  }

  async upload(financeEntryId: string, file: Express.Multer.File) {
    const entry = await this.prisma.client.financeEntry.findUnique({
      where: { id: financeEntryId },
    });
    if (!entry)
      throw new NotFoundException('Lancamento financeiro nao encontrado.');

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo nao suportado. Envie uma imagem (JPG/PNG/WEBP) ou PDF.',
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('Arquivo maior que 10MB.');
    }

    const storagePath = `${financeEntryId}/${randomUUID()}-${file.originalname}`;
    await this.storage.upload(storagePath, file.buffer, file.mimetype);

    const attachment = await this.prisma.client.financeAttachment.create({
      data: {
        financeEntryId,
        fileName: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
    return this.withUrl(attachment);
  }

  async findAll(financeEntryId: string) {
    const attachments = await this.prisma.client.financeAttachment.findMany({
      where: { financeEntryId },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(attachments.map((a) => this.withUrl(a)));
  }

  async remove(id: string) {
    const attachment = await this.prisma.client.financeAttachment.findUnique({
      where: { id },
    });
    if (!attachment) throw new NotFoundException('Anexo nao encontrado.');
    await this.storage.remove(attachment.storagePath);
    return this.prisma.client.financeAttachment.delete({ where: { id } });
  }
}
