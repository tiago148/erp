import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function withHourlyRate(employee: any, workdayHours: number) {
  const dailyRate = Number(employee.dailyRate);
  const hourlyRate = round2(dailyRate / workdayHours);
  return { ...employee, hourlyRate };
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getWorkdayHours() {
    const settings = await this.prisma.client.settings.findFirst();
    return 8;
  }

  async create(dto: CreateEmployeeDto) {
    const employee = await this.prisma.client.employee.create({ data: dto });
    const workdayHours = await this.getWorkdayHours();
    return withHourlyRate(employee, workdayHours);
  }

  async findAll(search?: string) {
    const employees = await this.prisma.client.employee.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { role: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });
    const workdayHours = await this.getWorkdayHours();
    return employees.map((e) => withHourlyRate(e, workdayHours));
  }

  async findOne(id: string) {
    const employee = await this.prisma.client.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Funcionario nao encontrado.');
    const workdayHours = await this.getWorkdayHours();
    return withHourlyRate(employee, workdayHours);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    const employee = await this.prisma.client.employee.update({ where: { id }, data: dto });
    const workdayHours = await this.getWorkdayHours();
    return withHourlyRate(employee, workdayHours);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.employee.delete({ where: { id } });
  }
}
