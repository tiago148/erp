import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@Injectable()
export class CalendarEventsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCalendarEventDto) {
    return this.prisma.client.calendarEvent.create({ data: { ...dto, date: new Date(dto.date) } });
  }

  findAll() {
    return this.prisma.client.calendarEvent.findMany({ orderBy: { date: 'asc' } });
  }

  async findOne(id: string) {
    const event = await this.prisma.client.calendarEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento nao encontrado.');
    return event;
  }

  async update(id: string, dto: UpdateCalendarEventDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);
    return this.prisma.client.calendarEvent.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.calendarEvent.delete({ where: { id } });
  }
}
