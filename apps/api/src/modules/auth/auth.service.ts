import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, UserStatus, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../core/shared/prisma.service';
import { CreateAuditUseCase } from '../audit/application/use-cases/create-audit.usecase';
import type { AuthResponse } from './auth.types';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDirectorDto } from './dto/register-director.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly createAuditUseCase: CreateAuditUseCase,
  ) {}

  async registerDirector(input: RegisterDirectorDto): Promise<AuthResponse> {
    if (input.password !== input.confirmPassword) {
      throw new ConflictException('Unable to complete request');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Unable to complete request');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase(),
        password: hashedPassword,
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        isActive: true,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(input: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.isActive || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async getInviteDetails(token: string) {
    const invite = await this.findValidInviteByToken(token);

    return {
      email: invite.email,
      role: invite.role,
      companyName: invite.company.name,
      departmentName: invite.department?.name ?? null,
    };
  }

  async acceptInvite(input: AcceptInviteDto): Promise<AuthResponse> {
    if (input.password !== input.confirmPassword) {
      throw new ConflictException('Unable to complete request');
    }

    const invite = await this.findValidInviteByToken(input.token);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      throw new ConflictException('Unable to complete request');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: input.name.trim(),
          email: invite.email,
          password: hashedPassword,
          role: invite.role,
          status: UserStatus.ACTIVE,
          isActive: true,
          companyId: invite.companyId,
          departmentId: invite.departmentId,
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { accepted: true },
      });

      return createdUser;
    });

    return this.buildAuthResponse(user);
  }

  private async findValidInviteByToken(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        company: {
          select: { name: true },
        },
        department: {
          select: { name: true },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.accepted) {
      throw new BadRequestException('Invite is invalid or expired');
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      await this.auditAndDeleteExpiredInvite(invite, 'system', 'invite.expired.rejected');
      throw new BadRequestException('Invite is invalid or expired');
    }

    return invite;
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

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        companyId: user.companyId ?? null,
        departmentId: user.departmentId ?? null,
      },
    };
  }
}
