import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Actor {
  userId?: string;
  email?: string;
}

interface LogEntry {
  actor?: Actor;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: LogEntry) {
    await this.prisma.client.auditLog.create({
      data: {
        userId: entry.actor?.userId,
        userEmail: entry.actor?.email,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        details: entry.details,
      },
    });
  }

  async findAll(params: { action?: string; take?: number }) {
    return this.prisma.client.auditLog.findMany({
      where: params.action ? { action: params.action } : undefined,
      orderBy: { createdAt: 'desc' },
      take: params.take ?? 200,
    });
  }
}
