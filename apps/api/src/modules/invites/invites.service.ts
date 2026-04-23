import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../core/shared/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actor: AuthenticatedUser, input: CreateInviteDto) {
    if (input.role !== UserRole.MANAGER && input.role !== UserRole.EMPLOYEE) {
      throw new BadRequestException('Invalid invite role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: { companyId: true },
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
      throw new ConflictException('Unable to create invite');
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
      },
    });

    return invite;
  }
}
