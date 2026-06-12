import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../core/shared/prisma.service';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import type { AuditRequestContext } from '../audit/audit.types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { EmailService } from '../email/email.service';
import { InviteEmailPublisher } from '../messaging/invite-email.publisher';
import type { InviteEmailPayload } from '../messaging/messaging.types';
import { CreateInviteDto } from './dto/create-invite.dto';
import type { InviteResponseItem, InviteViewStatus } from './invites.types';

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
    @Optional() private readonly inviteEmailPublisher?: InviteEmailPublisher,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  async create(
    actor: AuthenticatedUser,
    input: CreateInviteDto,
    requestContext?: AuditRequestContext,
  ) {
    const companyContext = await this.getActorCompanyContext(actor.sub);
    const department = await this.assertDepartmentAvailable(
      companyContext.companyId,
      input.departmentId,
      input.role,
    );

    const normalizedEmail = input.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Unable to create invite');
    }

    const existingInvite = await this.prisma.invite.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingInvite) {
      if (existingInvite.expiresAt.getTime() < Date.now()) {
        await this.deleteExpiredInvite(existingInvite.id);
      } else {
        throw new ConflictException('Unable to create invite');
      }
    }

    const invite = await this.prisma.invite.create({
      data: {
        email: normalizedEmail,
        role: input.role,
        companyId: companyContext.companyId,
        departmentId: department.id,
        token: this.createInviteToken(),
        expiresAt: this.createInviteExpirationDate(),
      },
      select: {
        id: true,
        email: true,
        role: true,
        departmentId: true,
        companyId: true,
        accepted: true,
        expiresAt: true,
        createdAt: true,
        token: true,
      },
    });

    const inviteUrl = this.buildInviteUrl(invite.token);
    const demoInviteUrl = this.isEmailDemoModeEnabled() ? inviteUrl : undefined;

    if (!this.isEmailDemoModeEnabled()) {
      try {
        await this.sendInviteMessage(this.buildInviteEmailPayload({
          inviteId: invite.id,
          companyName: companyContext.companyName,
          departmentName: department.name ?? null,
          email: invite.email,
          role: invite.role,
          inviteUrl,
          createdAt: invite.createdAt,
        }));
      } catch {
        if (!this.isRabbitMqEnabled()) {
          await this.prisma.invite.delete({
            where: { id: invite.id },
          });
        }

        throw new InternalServerErrorException('Unable to complete request');
      }
    }

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.INVITE_SENT,
      entity: AUDIT_ENTITIES.INVITE,
      entityId: invite.id,
      companyId: companyContext.companyId,
      departmentId: invite.departmentId,
      newValue: {
        inviteId: invite.id,
        email: invite.email,
        role: invite.role,
        departmentId: invite.departmentId,
        companyId: invite.companyId,
        expiresAt: invite.expiresAt.toISOString(),
      },
      requestContext,
    });

    return this.mapInviteResponse({
      ...invite,
      department: {
        id: department.id,
        name: department.name,
      },
    }, demoInviteUrl);
  }

  async list(actor: AuthenticatedUser): Promise<InviteResponseItem[]> {
    const companyContext = await this.getActorCompanyContext(actor.sub);
    const invites = await this.prisma.invite.findMany({
      where: {
        companyId: companyContext.companyId,
        accepted: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
        accepted: true,
        expiresAt: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return invites.map((invite) => this.mapInviteResponse(invite));
  }

  async getById(actor: AuthenticatedUser, inviteId: string): Promise<InviteResponseItem> {
    const companyContext = await this.getActorCompanyContext(actor.sub);
    const invite = await this.prisma.invite.findFirst({
      where: {
        id: inviteId,
        companyId: companyContext.companyId,
        accepted: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
        accepted: true,
        expiresAt: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    return this.mapInviteResponse(invite);
  }

  async resend(
    actor: AuthenticatedUser,
    inviteId: string,
    requestContext?: AuditRequestContext,
  ): Promise<InviteResponseItem> {
    const companyContext = await this.getActorCompanyContext(actor.sub);
    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        id: inviteId,
        companyId: companyContext.companyId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        departmentId: true,
        token: true,
        accepted: true,
        expiresAt: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
      },
    });

    if (!existingInvite) {
      throw new NotFoundException('Invite not found');
    }

    if (existingInvite.accepted) {
      throw new ConflictException('Invite has already been accepted');
    }

    if (!existingInvite.departmentId || !existingInvite.department) {
      throw new BadRequestException('Invite is invalid');
    }

    await this.assertDepartmentAvailable(
      companyContext.companyId,
      existingInvite.departmentId,
      existingInvite.role,
      existingInvite.id,
    );

    const expired = existingInvite.expiresAt.getTime() <= Date.now();
    const nextToken = expired ? this.createInviteToken() : existingInvite.token;
    const nextExpiresAt = expired
      ? this.createInviteExpirationDate()
      : existingInvite.expiresAt;

    const updatedInvite = await this.prisma.invite.update({
      where: { id: existingInvite.id },
      data: {
        token: nextToken,
        expiresAt: nextExpiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        accepted: true,
        expiresAt: true,
        createdAt: true,
        token: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const inviteUrl = this.buildInviteUrl(updatedInvite.token);
    const demoInviteUrl = this.isEmailDemoModeEnabled() ? inviteUrl : undefined;

    if (!this.isEmailDemoModeEnabled()) {
      try {
        await this.sendInviteMessage(this.buildInviteEmailPayload({
          inviteId: updatedInvite.id,
          companyName: companyContext.companyName,
          departmentName: updatedInvite.department?.name ?? null,
          email: updatedInvite.email,
          role: updatedInvite.role,
          inviteUrl,
          createdAt: updatedInvite.createdAt,
        }));
      } catch {
        throw new InternalServerErrorException('Unable to complete request');
      }
    }

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.INVITE_RESENT,
      entity: AUDIT_ENTITIES.INVITE,
      entityId: updatedInvite.id,
      companyId: companyContext.companyId,
      departmentId: updatedInvite.department?.id ?? null,
      oldValue: {
        expiresAt: existingInvite.expiresAt.toISOString(),
      },
      newValue: {
        inviteId: updatedInvite.id,
        email: updatedInvite.email,
        role: updatedInvite.role,
        departmentId: updatedInvite.department?.id ?? null,
        companyId: companyContext.companyId,
        expiresAt: updatedInvite.expiresAt.toISOString(),
      },
      metadata: {
        renewed: expired,
      },
      requestContext,
    });

    return this.mapInviteResponse(updatedInvite, demoInviteUrl);
  }

  private async getActorCompanyContext(actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: {
        companyId: true,
        company: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.companyId) {
      throw new BadRequestException('Company must be created first');
    }

    const departmentCount = await this.prisma.department.count({
      where: { companyId: user.companyId },
    });

    if (departmentCount < 1) {
      throw new BadRequestException('At least one department is required');
    }

    return {
      companyId: user.companyId,
      companyName: user.company?.name ?? 'STRATIX',
    };
  }

  private async assertDepartmentAvailable(
    companyId: string,
    departmentId: string,
    role: UserRole,
    currentInviteId?: string,
  ) {
    if (role !== UserRole.MANAGER && role !== UserRole.EMPLOYEE) {
      throw new BadRequestException('Invalid invite role');
    }

    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId,
      },
      select: {
        id: true,
        name: true,
        managerId: true,
      },
    });

    if (!department) {
      throw new BadRequestException('Invalid department');
    }

    if (role === UserRole.MANAGER) {
      if (department.managerId) {
        throw new ConflictException('Department already has a manager');
      }

      const pendingManagerInvite = await this.prisma.invite.findFirst({
        where: {
          departmentId: department.id,
          role: UserRole.MANAGER,
          accepted: false,
          expiresAt: {
            gt: new Date(),
          },
          ...(currentInviteId ? { id: { not: currentInviteId } } : {}),
        },
        select: { id: true },
      });

      if (pendingManagerInvite) {
        throw new ConflictException('Department already has a pending manager invite');
      }
    }

    return department;
  }

  private async sendInviteMessage(payload: InviteEmailPayload) {
    if (!this.isRabbitMqEnabled()) {
      await this.emailService.sendInviteEmail(payload);
      return;
    }

    try {
      if (!this.inviteEmailPublisher) {
        throw new Error('Invite e-mail publisher is not available');
      }

      await this.inviteEmailPublisher.publish(payload);
    } catch (error) {
      this.logger.warn(
        `RabbitMQ invite e-mail publish failed for invite ${payload.inviteId}; falling back to synchronous delivery`,
      );

      await this.emailService.sendInviteEmail(payload);

      if (error instanceof Error) {
        this.logger.warn(error.message);
      }
    }
  }

  private createInviteToken() {
    return randomBytes(32).toString('hex');
  }

  private createInviteExpirationDate() {
    return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  }

  private isEmailDemoModeEnabled() {
    return this.configService?.get<string>('EMAIL_DEMO_MODE') === 'true';
  }

  private isRabbitMqEnabled() {
    return this.configService?.get<string>('RABBITMQ_ENABLED') === 'true';
  }

  private buildInviteUrl(token: string) {
    const frontendUrl = this.configService?.get<string>('FRONTEND_URL')?.trim();

    if (!frontendUrl) {
      throw new InternalServerErrorException('Unable to complete request');
    }

    return `${frontendUrl}/accept-invite?token=${encodeURIComponent(token)}`;
  }

  private buildInviteEmailPayload(input: {
    inviteId: string;
    companyName: string;
    departmentName: string | null;
    email: string;
    role: UserRole;
    inviteUrl: string;
    createdAt: Date;
  }): InviteEmailPayload {
    return {
      inviteId: input.inviteId,
      email: input.email,
      role: input.role,
      companyName: input.companyName,
      departmentName: input.departmentName,
      inviteUrl: input.inviteUrl,
      createdAt: input.createdAt.toISOString(),
    };
  }

  private getInviteStatus(expiresAt: Date): InviteViewStatus {
    return expiresAt.getTime() > Date.now() ? 'PENDING' : 'EXPIRED';
  }

  private mapInviteResponse(invite: {
    id: string;
    email: string;
    role: UserRole;
    expiresAt: Date;
    createdAt: Date;
    department: {
      id: string;
      name: string;
    } | null;
  }, inviteUrl?: string): InviteResponseItem {
    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      department: invite.department,
      status: this.getInviteStatus(invite.expiresAt),
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
      ...(inviteUrl ? { inviteUrl } : {}),
    };
  }

  private async deleteExpiredInvite(inviteId: string) {
    await this.prisma.invite.delete({
      where: { id: inviteId },
    });
  }
}
