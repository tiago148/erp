import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { AddQuotationItemDto } from './dto/add-quotation-item.dto';
import { AddQuotationProposalDto } from './dto/add-quotation-proposal.dto';

@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post() create(@Body() dto: CreateQuotationDto) {
    return this.quotationsService.create(dto);
  }

  @Get() findAll(@Query('search') search?: string) {
    return this.quotationsService.findAll(search);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Post(':id/items') addItem(
    @Param('id') id: string,
    @Body() dto: AddQuotationItemDto,
  ) {
    return this.quotationsService.addItem(id, dto);
  }

  @Delete('items/:itemId') removeItem(@Param('itemId') itemId: string) {
    return this.quotationsService.removeItem(itemId);
  }

  @Post('items/:itemId/proposals') addProposal(
    @Param('itemId') itemId: string,
    @Body() dto: AddQuotationProposalDto,
  ) {
    return this.quotationsService.addProposal(itemId, dto);
  }

  @Post('proposals/:proposalId/winner') selectWinner(
    @Param('proposalId') proposalId: string,
  ) {
    return this.quotationsService.selectWinner(proposalId);
  }

  @Post(':id/generate-orders') generateOrders(@Param('id') id: string) {
    return this.quotationsService.generateOrders(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(id);
  }
}
