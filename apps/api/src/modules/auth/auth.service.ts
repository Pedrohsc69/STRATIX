import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, UserStatus, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../core/shared/prisma.service';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import type { AuditRequestContext } from '../audit/audit.types';
import { EmailService } from '../email/email.service';
import type { AuthResponse, AuthenticatedUser } from './auth.types';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { GoogleRegisterDirectorDto } from './dto/google-register-director.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDirectorDto } from './dto/register-director.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleTokenService } from './google-token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly googleTokenService: GoogleTokenService,
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

  async loginWithGoogle(input: GoogleLoginDto): Promise<AuthResponse> {
    const googleIdentity = await this.googleTokenService.verifyCredential(input.credential);
    const normalizedEmail = googleIdentity.email.trim().toLowerCase();

    if (!googleIdentity.emailVerified) {
      this.logger.warn(
        `Google login rejected: email_not_verified email=${this.maskEmail(normalizedEmail)}`,
      );
      throw new UnauthorizedException('A conta Google precisa ter um e-mail verificado.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      this.logger.warn(
        `Google login rejected: local_user_not_found email=${this.maskEmail(normalizedEmail)}`,
      );
      throw new NotFoundException(
        'Conta não encontrada. Cadastre-se ou aceite um convite antes de entrar com Google.',
      );
    }

    if (!user.isActive || user.status !== UserStatus.ACTIVE) {
      this.logger.warn(
        `Google login rejected: local_user_inactive email=${this.maskEmail(normalizedEmail)} status=${user.status}`,
      );
      throw new UnauthorizedException('Conta inativa. Entre em contato com o administrador.');
    }

    return this.buildAuthResponse(user);
  }

  async registerDirectorWithGoogle(input: GoogleRegisterDirectorDto): Promise<AuthResponse> {
    const googleIdentity = await this.googleTokenService.verifyCredential(input.credential);
    const normalizedEmail = googleIdentity.email.trim().toLowerCase();

    if (!googleIdentity.emailVerified) {
      this.logger.warn(
        `Google director registration rejected: email_not_verified email=${this.maskEmail(normalizedEmail)}`,
      );
      throw new UnauthorizedException('A conta Google precisa ter um e-mail verificado.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      this.logger.warn(
        `Google director registration rejected: local_user_already_exists email=${this.maskEmail(normalizedEmail)}`,
      );
      throw new ConflictException(
        'Já existe uma conta com este e-mail. Faça login ou use outro e-mail.',
      );
    }

    const internalPassword = randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(internalPassword, 10);
    const user = await this.prisma.user.create({
      data: {
        name: this.resolveGoogleDisplayName(googleIdentity.name, normalizedEmail),
        email: normalizedEmail,
        password: hashedPassword,
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        isActive: true,
      },
    });

    return this.buildAuthResponse(user);
  }

  private maskEmail(email: string) {
    const [localPart, domainPart] = email.split('@');

    if (!localPart || !domainPart) {
      return 'invalid-email';
    }

    const visibleLocal = localPart.length <= 2 ? localPart[0] ?? '*' : localPart.slice(0, 2);

    return `${visibleLocal}***@${domainPart}`;
  }

  private resolveGoogleDisplayName(name: string | null, email: string) {
    const trimmedName = name?.trim();

    if (trimmedName) {
      return trimmedName;
    }

    return email.split('@')[0] ?? email;
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

  async acceptInvite(
    input: AcceptInviteDto,
    requestContext?: AuditRequestContext,
  ): Promise<AuthResponse> {
    if (input.password !== input.confirmPassword) {
      throw new ConflictException('Unable to complete request');
    }

    const invite = await this.findValidInviteByToken(input.token);
    if (
      (invite.role === UserRole.MANAGER || invite.role === UserRole.EMPLOYEE) &&
      !invite.departmentId
    ) {
      throw new BadRequestException('Invite is invalid or expired');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      throw new ConflictException('Unable to complete request');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      let targetDepartment:
        | {
            id: string;
            companyId: string;
            managerId: string | null;
          }
        | null = null;

      if (invite.departmentId) {
        targetDepartment = await tx.department.findUnique({
          where: { id: invite.departmentId },
          select: {
            id: true,
            companyId: true,
            managerId: true,
          },
        });

        if (!targetDepartment) {
          throw new NotFoundException('Department not found');
        }

        if (targetDepartment.companyId !== invite.companyId) {
          throw new BadRequestException('Invite is invalid or expired');
        }

        if (invite.role === UserRole.MANAGER && targetDepartment.managerId) {
          throw new ConflictException('Department already has a manager');
        }
      }

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

      if (invite.role === UserRole.MANAGER && targetDepartment) {
        await tx.department.update({
          where: { id: targetDepartment.id },
          data: {
            managerId: createdUser.id,
          },
        });
      }

      await tx.invite.update({
        where: { id: invite.id },
        data: { accepted: true },
      });

      return createdUser;
    });

    await this.auditService.log({
      actor: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      action: AUDIT_ACTIONS.INVITE_ACCEPTED,
      entity: AUDIT_ENTITIES.INVITE,
      entityId: invite.id,
      companyId: invite.companyId,
      departmentId: invite.departmentId,
      newValue: {
        inviteId: invite.id,
        acceptedByUserId: user.id,
        acceptedByEmail: user.email,
      },
      requestContext,
    });

    return this.buildAuthResponse(user);
  }

  async changePassword(
    actor: AuthenticatedUser,
    input: ChangePasswordDto,
    requestContext?: AuditRequestContext,
  ) {
    if (input.newPassword !== input.confirmPassword) {
      throw new ConflictException('Unable to complete request');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
    });

    if (!user || !user.isActive || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(input.currentPassword, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isSamePassword = await bcrypt.compare(input.newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    this.assertPasswordStrength(input.newPassword);

    const hashedPassword = await bcrypt.hash(input.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    await this.auditService.log({
      actor: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      companyId: user.companyId ?? null,
      departmentId: user.departmentId ?? null,
      metadata: {
        email: user.email,
      },
      requestContext,
    });

    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  async forgotPassword(input: ForgotPasswordDto) {
    const genericResponse = {
      success: true,
      message: 'If the account exists, a recovery link has been sent.',
    };

    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user || !user.isActive || user.status !== UserStatus.ACTIVE) {
      return genericResponse;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: this.getPasswordResetExpirationDate(),
      },
    });

    await this.emailService.sendPasswordResetEmail({
      companyName: user.company?.name ?? 'STRATIX',
      email: user.email,
      token: rawToken,
      userName: user.name,
    });

    return genericResponse;
  }

  async resetPassword(input: ResetPasswordDto) {
    if (input.newPassword !== input.confirmPassword) {
      throw new ConflictException('Unable to complete request');
    }

    this.assertPasswordStrength(input.newPassword);

    const tokenHash = this.hashToken(input.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!resetToken || resetToken.usedAt) {
      throw new BadRequestException('Recovery token is invalid or expired');
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Recovery token is invalid or expired');
    }

    const isSamePassword = await bcrypt.compare(input.newPassword, resetToken.user.password);

    if (isSamePassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: {
            not: resetToken.id,
          },
        },
        data: {
          usedAt: new Date(),
        },
      });
    });

    await this.auditService.log({
      actor: {
        id: resetToken.user.id,
        email: resetToken.user.email,
        role: resetToken.user.role,
      },
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      entity: AUDIT_ENTITIES.USER,
      entityId: resetToken.userId,
      companyId: resetToken.user.companyId ?? null,
      departmentId: resetToken.user.departmentId ?? null,
      metadata: {
        email: resetToken.user.email,
        source: 'password-reset',
      },
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
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
      await this.deleteExpiredInvite(invite.id);
      throw new BadRequestException('Invite is invalid or expired');
    }

    return invite;
  }

  private async deleteExpiredInvite(inviteId: string) {
    await this.prisma.invite.delete({
      where: { id: inviteId },
    });
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastAccessAt: new Date(),
      },
    });

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            businessArea: true,
          },
        },
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
    });

    return {
      accessToken,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        status: currentUser.status,
        isActive: currentUser.isActive,
        companyId: currentUser.companyId ?? null,
        departmentId: currentUser.departmentId ?? null,
      },
      company: currentUser.company
        ? {
            id: currentUser.company.id,
            name: currentUser.company.name,
            businessArea: currentUser.company.businessArea,
          }
        : null,
    };
  }

  private assertPasswordStrength(password: string) {
    const hasMinimumLength = password.length >= 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasMinimumLength || !hasLetter || !hasNumber) {
      throw new BadRequestException(
        'Password must have at least 8 characters and include letters and numbers',
      );
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getPasswordResetExpirationDate() {
    return new Date(Date.now() + 1000 * 60 * 60);
  }
}
