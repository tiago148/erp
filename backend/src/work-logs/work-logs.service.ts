import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';

@Injectable()
export class WorkLogsService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      project: true,
      employees: { include: { employee: true } },
      vehicleUsages: { include: { vehicle: true, driver: true } },
      toolsUsed: { include: { tool: true } },
    };
  }

  async create(dto: CreateWorkLogDto) {
    const workLog = await this.prisma.client.workLog.create({
      data: {
        projectId: dto.projectId,
        date: new Date(dto.date),
        weather: dto.weather,
        description: dto.description,
        occurrences: dto.occurrences,
        noTravel: dto.noTravel ?? false,
        employees: {
          create: (dto.employeeIds || []).map((employeeId) => ({ employeeId })),
        },
        vehicleUsages: {
          create: dto.noTravel
            ? []
            : (dto.vehicles || []).map((v) => ({
                vehicleId: v.vehicleId,
                driverId: v.driverId,
              })),
        },
        toolsUsed: {
          create: (dto.toolIds || []).map((toolId) => ({ toolId })),
        },
      },
      include: this.include(),
    });

    return workLog;
  }

  findAll(projectId?: string) {
    return this.prisma.client.workLog.findMany({
      where: projectId ? { projectId } : undefined,
      include: this.include(),
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.client.workLog.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!log) throw new NotFoundException('Registro de diario nao encontrado.');
    return log;
  }

  async update(id: string, dto: UpdateWorkLogDto) {
    await this.findOne(id);

    const updateData: any = {
      weather: dto.weather,
      description: dto.description,
      occurrences: dto.occurrences,
      noTravel: dto.noTravel,
    };
    if (dto.projectId) updateData.projectId = dto.projectId;
    if (dto.date) updateData.date = new Date(dto.date);

    if (dto.employeeIds) {
      await this.prisma.client.workLogEmployee.deleteMany({
        where: { workLogId: id },
      });
      updateData.employees = {
        create: dto.employeeIds.map((employeeId) => ({ employeeId })),
      };
    }

    if (dto.noTravel) {
      await this.prisma.client.workLogVehicle.deleteMany({
        where: { workLogId: id },
      });
      updateData.vehicleUsages = { create: [] };
    } else if (dto.vehicles) {
      await this.prisma.client.workLogVehicle.deleteMany({
        where: { workLogId: id },
      });
      updateData.vehicleUsages = {
        create: dto.vehicles.map((v) => ({
          vehicleId: v.vehicleId,
          driverId: v.driverId,
        })),
      };
    }

    if (dto.toolIds) {
      await this.prisma.client.workLogTool.deleteMany({
        where: { workLogId: id },
      });
      updateData.toolsUsed = {
        create: dto.toolIds.map((toolId) => ({ toolId })),
      };
    }

    return this.prisma.client.workLog.update({
      where: { id },
      data: updateData,
      include: this.include(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.workLog.delete({ where: { id } });
  }
}
