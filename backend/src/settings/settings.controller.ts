import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get() get() { return this.settingsService.get(); }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Body() dto: UpdateSettingsDto) { return this.settingsService.update(dto); }

  @Get('backup')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  exportBackup() { return this.settingsService.exportBackup(); }
}
