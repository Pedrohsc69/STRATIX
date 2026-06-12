import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { InviteEmailPayload } from '../messaging/messaging.types';
import { buildInviteTemplate } from './templates/invite.template';
import { buildPasswordResetTemplate } from './templates/password-reset.template';

type SendPasswordResetEmailInput = {
  companyName: string;
  email: string;
  token: string;
  userName?: string | null;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.getOrThrow<string>('RESEND_API_KEY'));
  }

  async sendInviteEmail(input: InviteEmailPayload) {
    const emailFrom = this.configService.getOrThrow<string>('EMAIL_FROM');

    try {
      await this.resend.emails.send({
        from: emailFrom,
        to: input.email,
        subject: `Convite STRATIX - ${input.companyName}`,
        html: buildInviteTemplate({
          acceptUrl: input.inviteUrl,
          companyName: input.companyName,
          departmentName: input.departmentName,
          role: input.role,
        }),
      });
    } catch (error) {
      this.logger.error('Failed to send invite e-mail', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Unable to complete request');
    }
  }

  async sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const emailFrom = this.configService.getOrThrow<string>('EMAIL_FROM');
    const resetUrl = `${frontendUrl}/recover-password?token=${encodeURIComponent(input.token)}`;

    try {
      await this.resend.emails.send({
        from: emailFrom,
        to: input.email,
        subject: `Redefinição de senha STRATIX - ${input.companyName}`,
        html: buildPasswordResetTemplate({
          resetUrl,
          companyName: input.companyName,
          userName: input.userName,
        }),
      });
    } catch (error) {
      this.logger.error(
        'Failed to send password reset e-mail',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Unable to complete request');
    }
  }
}
