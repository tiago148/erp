import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { ConfirmAccountDto } from './dto/confirm-account.dto';
import { ResendConfirmationDto } from './dto/resend-confirmation.dto';
import { UpdateUserModulesDto } from './dto/update-user-modules.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Limite bem mais restrito que o global (100/min) especificamente aqui --
  // login/troca de senha sao o alvo classico de forca bruta/credential
  // stuffing.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    return req.user;
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createUser(@Body() dto: CreateUserByAdminDto, @Req() req: any) {
    return this.authService.createUserByAdmin(dto, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  listUsers() {
    return this.authService.listUsers();
  }

  @Patch('users/:id/modules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateUserModules(
    @Param('id') id: string,
    @Body() dto: UpdateUserModulesDto,
    @Req() req: any,
  ) {
    return this.authService.updateAllowedModules(id, dto.allowedModules, {
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Post('resend-confirmation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  resendConfirmation(@Body() dto: ResendConfirmationDto) {
    return this.authService.resendConfirmation(dto.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  confirmAccount(@Body() dto: ConfirmAccountDto) {
    return this.authService.confirmAccount(dto);
  }
}
