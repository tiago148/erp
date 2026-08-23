import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post() create(@Body() dto: CreateTaskDto) { return this.tasksService.create(dto); }

  @Get() findAll() { return this.tasksService.findAll(); }

  @Get(':id') findOne(@Param('id') id: string) { return this.tasksService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateTaskDto) { return this.tasksService.update(id, dto); }

  @Delete(':id') remove(@Param('id') id: string) { return this.tasksService.remove(id); }
}
