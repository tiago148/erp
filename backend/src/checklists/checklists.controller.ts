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
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

@Controller('checklists')
@UseGuards(JwtAuthGuard)
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post() create(@Body() dto: CreateChecklistDto, @Req() req: any) {
    return this.checklistsService.create(dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Get() findAll() {
    return this.checklistsService.findAll();
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.checklistsService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateChecklistDto,
    @Req() req: any,
  ) {
    return this.checklistsService.update(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Delete(':id') remove(@Param('id') id: string, @Req() req: any) {
    return this.checklistsService.remove(id, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }
}
