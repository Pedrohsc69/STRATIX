import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { Resend } from 'resend';
import { buildInviteTemplate } from './templates/invite.template';

type SendInviteEmailInput = {
  companyName: string;
  departmentName: string | null;
  email: string;
  inviteeName?: string | null;
  role: UserRole;
  token: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.getOrThrow<string>('RESEND_API_KEY'));
  }

  async sendInviteEmail(input: SendInviteEmailInput) {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const emailFrom = this.configService.getOrThrow<string>('EMAIL_FROM');
    const acceptUrl = `${frontendUrl}/accept-invite?token=${encodeURIComponent(input.token)}`;

    try {
      await this.resend.emails.send({
        from: emailFrom,
        to: input.email,
        subject: `Convite STRATIX - ${input.companyName}`,
        html: buildInviteTemplate({
          acceptUrl,
          companyName: input.companyName,
          departmentName: input.departmentName,
          inviteeName: input.inviteeName,
          role: input.role,
        }),
      });
    } catch (error) {
      this.logger.error('Failed to send invite e-mail', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Unable to complete request');
    }
  }
}
