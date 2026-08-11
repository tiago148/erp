import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarEventsService } from './calendar-events.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@Controller('calendar-events')
@UseGuards(JwtAuthGuard)
export class CalendarEventsController {
  constructor(private readonly calendarEventsService: CalendarEventsService) {}

  @Post() create(@Body() dto: CreateCalendarEventDto) { return this.calendarEventsService.create(dto); }

  @Get() findAll() { return this.calendarEventsService.findAll(); }

  @Get(':id') findOne(@Param('id') id: string) { return this.calendarEventsService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCalendarEventDto) { return this.calendarEventsService.update(id, dto); }

  @Delete(':id') remove(@Param('id') id: string) { return this.calendarEventsService.remove(id); }
}
