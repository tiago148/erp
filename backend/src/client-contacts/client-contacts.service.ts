import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateClientContactDto } from './dto/update-client-contact.dto';

@Injectable()
export class ClientContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientContactDto) {
    const client = await this.prisma.client.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) throw new NotFoundException('Cliente nao encontrado.');

    return this.prisma.client.clientContact.create({ data: dto });
  }

  findAll(clientId?: string) {
    return this.prisma.client.clientContact.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.client.clientContact.findUnique({
      where: { id },
    });
    if (!contact) throw new NotFoundException('Contato nao encontrado.');
    return contact;
  }

  async update(id: string, dto: UpdateClientContactDto) {
    await this.findOne(id);
    return this.prisma.client.clientContact.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.clientContact.delete({ where: { id } });
  }
}
