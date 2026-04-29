import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../core/shared/prisma.service';
import { CreateAuditUseCase } from '../audit/application/use-cases/create-audit.usecase';
import type { AuthenticatedUser } from '../auth/auth.types';
import { EmailService } from '../email/email.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly createAuditUseCase: CreateAuditUseCase,
  ) {}

  async create(actor: AuthenticatedUser, input: CreateInviteDto) {
    if (input.role !== UserRole.MANAGER && input.role !== UserRole.EMPLOYEE) {
      throw new BadRequestException('Invalid invite role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
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

    const department = await this.prisma.department.findFirst({
      where: {
        id: input.departmentId,
        companyId: user.companyId,
      },
    });

    if (!department) {
      throw new BadRequestException('Invalid department');
    }

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
        await this.auditAndDeleteExpiredInvite(existingInvite, actor.sub, 'invite.expired.replaced');
      } else {
        throw new ConflictException('Unable to create invite');
      }
    }

    const invite = await this.prisma.invite.create({
      data: {
        email: normalizedEmail,
        role: input.role,
        companyId: user.companyId,
        departmentId: department.id,
        token: randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
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

    try {
      await this.emailService.sendInviteEmail({
        companyName: user.company?.name ?? 'STRATIX',
        departmentName: department.name ?? null,
        email: invite.email,
        role: invite.role,
        token: invite.token,
      });
    } catch {
      await this.prisma.invite.delete({
        where: { id: invite.id },
      });

      await this.createAuditUseCase.execute({
        userId: actor.sub,
        action: 'invite.email.failed',
        entity: 'invite',
        metadata: {
          inviteId: invite.id,
          email: invite.email,
          companyId: invite.companyId,
          departmentId: invite.departmentId,
        },
      });

      throw new InternalServerErrorException('Unable to complete request');
    }

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      departmentId: invite.departmentId,
      companyId: invite.companyId,
      accepted: invite.accepted,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    };
  }

  private async auditAndDeleteExpiredInvite(
    invite: {
      id: string;
      email: string;
      role: UserRole;
      companyId: string;
      departmentId: string | null;
      token: string;
      expiresAt: Date;
    },
    actorId: string,
    action: string,
  ) {
    await this.createAuditUseCase.execute({
      userId: actorId,
      action,
      entity: 'invite',
      metadata: {
        inviteId: invite.id,
        email: invite.email,
        role: invite.role,
        companyId: invite.companyId,
        departmentId: invite.departmentId,
        expiresAt: invite.expiresAt.toISOString(),
        tokenHash: createHash('sha256').update(invite.token).digest('hex'),
      },
    });

    await this.prisma.invite.delete({
      where: { id: invite.id },
    });
  }
}
