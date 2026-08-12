import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    if (!host) {
      this.transporter = null;
      return;
    }

    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.configService.get<string>('SMTP_PORT') || 587),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: user ? { user, pass } : undefined,
    });
  }

  async sendAccountConfirmation(to: string, name: string, confirmUrl: string) {
    const subject = 'Confirme sua conta - ERP Inox';
    const text = `Ola ${name},\n\nUma conta foi criada para voce no ERP Inox. Para ativa-la e definir sua senha, acesse o link abaixo:\n\n${confirmUrl}\n\nEste link expira em 7 dias.`;
    const html = `<p>Ola ${name},</p><p>Uma conta foi criada para voce no ERP Inox. Para ativa-la e definir sua senha, acesse o link abaixo:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p><p>Este link expira em 7 dias.</p>`;

    if (!this.transporter) {
      this.logger.warn(
        `SMTP nao configurado (defina SMTP_HOST no .env). Link de confirmacao para ${to}: ${confirmUrl}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from:
        this.configService.get<string>('SMTP_FROM') ||
        'no-reply@erp-inox.local',
      to,
      subject,
      text,
      html,
    });
  }
}
