import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LessonsLearnedService } from './lessons-learned.service';
import { CreateLessonLearnedDto } from './dto/create-lesson-learned.dto';
import { UpdateLessonLearnedDto } from './dto/update-lesson-learned.dto';

@Controller('lessons-learned')
@UseGuards(JwtAuthGuard)
export class LessonsLearnedController {
  constructor(private readonly lessonsLearnedService: LessonsLearnedService) {}

  @Post() create(@Body() dto: CreateLessonLearnedDto, @Req() req: any) {
    return this.lessonsLearnedService.create(dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Get() findAll() {
    return this.lessonsLearnedService.findAll();
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.lessonsLearnedService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonLearnedDto,
    @Req() req: any,
  ) {
    return this.lessonsLearnedService.update(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Delete(':id') remove(@Param('id') id: string, @Req() req: any) {
    return this.lessonsLearnedService.remove(id, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }
}
