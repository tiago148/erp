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
import { PlaybooksService } from './playbooks.service';
import { CreatePlaybookDto } from './dto/create-playbook.dto';
import { UpdatePlaybookDto } from './dto/update-playbook.dto';

@Controller('playbooks')
@UseGuards(JwtAuthGuard)
export class PlaybooksController {
  constructor(private readonly playbooksService: PlaybooksService) {}

  @Post() create(@Body() dto: CreatePlaybookDto, @Req() req: any) {
    return this.playbooksService.create(dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Get() findAll() {
    return this.playbooksService.findAll();
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.playbooksService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdatePlaybookDto,
    @Req() req: any,
  ) {
    return this.playbooksService.update(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Delete(':id') remove(@Param('id') id: string, @Req() req: any) {
    return this.playbooksService.remove(id, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }
}
