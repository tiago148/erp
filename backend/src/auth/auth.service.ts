import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService, Actor } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { ConfirmAccountDto } from './dto/confirm-account.dto';

const CONFIRMATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Este email já está cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.client.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        entity: 'User',
        details: `Tentativa de login com e-mail inexistente: ${dto.email}`,
      });
      throw new UnauthorizedException('Email ou senha inválidos.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      await this.auditService.log({
        actor: { userId: user.id, email: user.email },
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user.id,
        details: 'Senha incorreta.',
      });
      throw new UnauthorizedException('Email ou senha inválidos.');
    }

    if (!user.active) {
      throw new UnauthorizedException(
        'Conta ainda não confirmada. Verifique seu e-mail ou peça um reenvio ao administrador.',
      );
    }

    await this.auditService.log({
      actor: { userId: user.id, email: user.email },
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
    });

    return this.buildAuthResponse(user);
  }

  async createUserByAdmin(dto: CreateUserByAdminDto, actor?: Actor) {
    const existing = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Este email já está cadastrado.');
    }

    const placeholderPassword = await bcrypt.hash(
      randomBytes(24).toString('hex'),
      10,
    );
    const confirmationToken = randomBytes(32).toString('hex');

    const user = await this.prisma.client.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: placeholderPassword,
        role: dto.role ?? 'USER',
        active: false,
        confirmationToken,
        confirmationTokenExpiresAt: new Date(
          Date.now() + CONFIRMATION_TOKEN_TTL_MS,
        ),
      },
    });

    await this.sendConfirmationEmail(user.email, user.name, confirmationToken);

    await this.auditService.log({
      actor,
      action: 'USER_CREATE',
      entity: 'User',
      entityId: user.id,
      details: `${user.name} <${user.email}> (role: ${user.role})`,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
    };
  }

  async listUsers() {
    return this.prisma.client.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirmAccount(dto: ConfirmAccountDto) {
    const user = await this.prisma.client.user.findUnique({
      where: { confirmationToken: dto.token },
    });
    if (!user) {
      throw new NotFoundException('Token de confirmação inválido.');
    }
    if (user.active) {
      throw new BadRequestException('Esta conta já foi confirmada.');
    }
    if (
      !user.confirmationTokenExpiresAt ||
      user.confirmationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Token de confirmação expirado. Peça um novo ao administrador.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.client.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        active: true,
        confirmationToken: null,
        confirmationTokenExpiresAt: null,
      },
    });

    return this.buildAuthResponse(updated);
  }

  async resendConfirmation(email: string) {
    const user = await this.prisma.client.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (user.active) {
      throw new BadRequestException('Esta conta já foi confirmada.');
    }

    const confirmationToken = randomBytes(32).toString('hex');
    const updated = await this.prisma.client.user.update({
      where: { id: user.id },
      data: {
        confirmationToken,
        confirmationTokenExpiresAt: new Date(
          Date.now() + CONFIRMATION_TOKEN_TTL_MS,
        ),
      },
    });

    await this.sendConfirmationEmail(
      updated.email,
      updated.name,
      confirmationToken,
    );
    return { message: 'E-mail de confirmação reenviado.' };
  }

  private async sendConfirmationEmail(
    email: string,
    name: string,
    token: string,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const confirmUrl = `${frontendUrl}/confirmar-conta?token=${token}`;
    await this.emailService.sendAccountConfirmation(email, name, confirmUrl);
  }

  private buildAuthResponse(user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
