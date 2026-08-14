import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get() get() {
    return this.settingsService.get();
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Body() dto: UpdateSettingsDto, @Req() req: any) {
    return this.settingsService.update(dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Get('backup')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  exportBackup() {
    return this.settingsService.exportBackup();
  }

  @Post('restore')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  restoreBackup(@Body() dto: RestoreBackupDto, @Req() req: any) {
    return this.settingsService.restoreBackup(dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }
}
