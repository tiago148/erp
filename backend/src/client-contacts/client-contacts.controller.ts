import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientContactsService } from './client-contacts.service';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateClientContactDto } from './dto/update-client-contact.dto';

@Controller('client-contacts')
@UseGuards(JwtAuthGuard)
export class ClientContactsController {
  constructor(private readonly clientContactsService: ClientContactsService) {}

  @Post() create(@Body() dto: CreateClientContactDto) {
    return this.clientContactsService.create(dto);
  }

  @Get() findAll(@Query('clientId') clientId?: string) {
    return this.clientContactsService.findAll(clientId);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.clientContactsService.findOne(id);
  }

  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateClientContactDto,
  ) {
    return this.clientContactsService.update(id, dto);
  }

  @Delete(':id') remove(@Param('id') id: string) {
    return this.clientContactsService.remove(id);
  }
}
