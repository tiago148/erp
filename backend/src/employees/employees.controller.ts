import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post() create(@Body() dto: CreateEmployeeDto) { return this.employeesService.create(dto); }

  @Get() findAll(@Query('search') search?: string) { return this.employeesService.findAll(search); }

  @Get(':id') findOne(@Param('id') id: string) { return this.employeesService.findOne(id); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) { return this.employeesService.update(id, dto); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) { return this.employeesService.remove(id); }
}
