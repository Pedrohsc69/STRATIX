import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ThemePreference, UserRole, type UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/shared/prisma.service';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import type { AuditRequestContext } from '../audit/audit.types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { DeleteCompanyDto } from './dto/delete-company.dto';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { UpdateMySettingsDto } from './dto/update-my-settings.dto';
import type {
  CompanySettings,
  DeleteCompanyResponse,
  PersonalSettings,
  SettingsContext,
  SettingsResponse,
} from './settings.types';

const defaultPersonalSettings: PersonalSettings = {
  theme: ThemePreference.SYSTEM,
  language: 'pt-BR',
  emailNotifications: true,
  inviteNotifications: true,
  okrNotifications: true,
  cycleNotifications: true,
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardDomainService: DashboardDomainService,
    private readonly auditService: AuditService,
  ) {}

  async getMe(actor: AuthenticatedUser): Promise<SettingsResponse> {
    const user = await this.getActorSettingsContext(actor);
    return this.buildResponse(user);
  }

  async updateMe(
    actor: AuthenticatedUser,
    input: UpdateMySettingsDto,
    requestContext?: AuditRequestContext,
  ): Promise<SettingsResponse> {
    const user = await this.getActorSettingsContext(actor);
    const oldSettings = this.extractPersonalSettings(user.settings);

    const nextLanguage =
      typeof input.language === 'string' && input.language.trim()
        ? input.language.trim()
        : undefined;

    await this.prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        theme: input.theme ?? defaultPersonalSettings.theme,
        language: nextLanguage ?? defaultPersonalSettings.language,
        emailNotifications:
          input.emailNotifications ?? defaultPersonalSettings.emailNotifications,
        inviteNotifications:
          input.inviteNotifications ?? defaultPersonalSettings.inviteNotifications,
        okrNotifications:
          input.okrNotifications ?? defaultPersonalSettings.okrNotifications,
        cycleNotifications:
          input.cycleNotifications ?? defaultPersonalSettings.cycleNotifications,
      },
      update: {
        ...(input.theme ? { theme: input.theme } : {}),
        ...(nextLanguage ? { language: nextLanguage } : {}),
        ...(typeof input.emailNotifications === 'boolean'
          ? { emailNotifications: input.emailNotifications }
          : {}),
        ...(typeof input.inviteNotifications === 'boolean'
          ? { inviteNotifications: input.inviteNotifications }
          : {}),
        ...(typeof input.okrNotifications === 'boolean'
          ? { okrNotifications: input.okrNotifications }
          : {}),
        ...(typeof input.cycleNotifications === 'boolean'
          ? { cycleNotifications: input.cycleNotifications }
          : {}),
      },
    });

    const newSettings = {
      ...oldSettings,
      ...(input.theme ? { theme: input.theme } : {}),
      ...(nextLanguage ? { language: nextLanguage } : {}),
      ...(typeof input.emailNotifications === 'boolean'
        ? { emailNotifications: input.emailNotifications }
        : {}),
      ...(typeof input.inviteNotifications === 'boolean'
        ? { inviteNotifications: input.inviteNotifications }
        : {}),
      ...(typeof input.okrNotifications === 'boolean'
        ? { okrNotifications: input.okrNotifications }
        : {}),
      ...(typeof input.cycleNotifications === 'boolean'
        ? { cycleNotifications: input.cycleNotifications }
        : {}),
    };

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.SETTINGS_UPDATED,
      entity: AUDIT_ENTITIES.SETTINGS,
      entityId: user.settings?.id ?? user.id,
      companyId: user.companyId ?? null,
      departmentId: user.departmentId ?? null,
      oldValue: oldSettings,
      newValue: newSettings,
      requestContext,
    });

    return this.getMe(actor);
  }

  async getCompany(actor: AuthenticatedUser): Promise<CompanySettings> {
    const user = await this.getActorSettingsContext(actor);
    this.assertDirector(user.role);

    if (!user.company) {
      throw new NotFoundException('Company not found');
    }

    return this.buildCompanySettings(user.company, true);
  }

  async updateCompany(
    actor: AuthenticatedUser,
    input: UpdateCompanySettingsDto,
    requestContext?: AuditRequestContext,
  ): Promise<CompanySettings> {
    const user = await this.getActorSettingsContext(actor);
    this.assertDirector(user.role);

    if (!user.companyId || !user.company) {
      throw new NotFoundException('Company not found');
    }

    const normalizedName =
      typeof input.name === 'string' && input.name.trim()
        ? input.name.trim()
        : undefined;
    const normalizedBusinessArea =
      typeof input.businessArea === 'string' && input.businessArea.trim()
        ? input.businessArea.trim()
        : undefined;
    const normalizedCnpj =
      typeof input.cnpj === 'string' && input.cnpj.trim()
        ? input.cnpj.replace(/\D/g, '')
        : undefined;

    if (normalizedCnpj && !/^\d{14}$/.test(normalizedCnpj)) {
      throw new BadRequestException('CNPJ must have 14 digits');
    }

    if (!normalizedName && !normalizedBusinessArea && !normalizedCnpj) {
      return this.buildCompanySettings(user.company, true);
    }

    if (
      normalizedCnpj &&
      normalizedCnpj !== user.company.cnpj
    ) {
      const existingCompany = await this.prisma.company.findFirst({
        where: {
          cnpj: normalizedCnpj,
          id: {
            not: user.companyId,
          },
        },
        select: { id: true },
      });

      if (existingCompany) {
        throw new BadRequestException('CNPJ already in use');
      }
    }

    const company = await this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        ...(normalizedName ? { name: normalizedName } : {}),
        ...(normalizedBusinessArea ? { businessArea: normalizedBusinessArea } : {}),
        ...(normalizedCnpj ? { cnpj: normalizedCnpj } : {}),
      },
    });

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.SETTINGS_UPDATED,
      entity: AUDIT_ENTITIES.COMPANY,
      entityId: company.id,
      companyId: company.id,
      departmentId: user.departmentId ?? null,
      oldValue: this.buildCompanySettings(user.company, true),
      newValue: this.buildCompanySettings(company, true),
      requestContext,
    });

    return this.buildCompanySettings(company, true);
  }

  async deleteCompany(
    actor: AuthenticatedUser,
    input: DeleteCompanyDto,
    requestContext?: AuditRequestContext,
  ): Promise<DeleteCompanyResponse> {
    const user = await this.getActorSettingsContext(actor);
    this.assertDirector(user.role);

    if (!user.companyId || !user.company) {
      throw new NotFoundException('Company not found');
    }

    const companyId = user.companyId;

    const companyNameConfirmation = input.companyNameConfirmation?.trim();

    if (!companyNameConfirmation || companyNameConfirmation !== user.company.name) {
      throw new BadRequestException('Company confirmation is invalid');
    }

    if (user.hasUsablePassword) {
      if (!input.currentPassword) {
        throw new BadRequestException('Current password is required');
      }

      const passwordMatches = await bcrypt.compare(input.currentPassword, user.password);

      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      const normalizedEmailConfirmation =
        input.directorEmailConfirmation?.trim().toLowerCase() ?? '';

      if (normalizedEmailConfirmation !== user.email.toLowerCase()) {
        throw new BadRequestException('Director confirmation is invalid');
      }
    }

    const companyScope = { companyId };
    const deletionSummary = await this.buildCompanyDeletionSummary(companyId);

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.COMPANY_DELETED,
      entity: AUDIT_ENTITIES.COMPANY,
      entityId: companyId,
      companyId,
      departmentId: user.departmentId ?? null,
      oldValue: {
        company: this.buildCompanySettings(user.company, true),
        deletionSummary,
      },
      newValue: {
        deleted: true,
      },
      metadata: {
        confirmationMethod: user.hasUsablePassword ? 'password' : 'company-name-and-email',
      },
      requestContext,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.progressOKR.deleteMany({
        where: {
          OR: [
            {
              actor: {
                companyId: companyScope.companyId,
              },
            },
            {
              okr: {
                objective: {
                  cycle: {
                    department: companyScope,
                  },
                },
              },
            },
          ],
        },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          user: companyScope,
        },
      });

      await tx.userSettings.deleteMany({
        where: {
          user: companyScope,
        },
      });

      await tx.invite.deleteMany({
        where: companyScope,
      });

      await tx.department.updateMany({
        where: companyScope,
        data: {
          managerId: null,
        },
      });

      await tx.oKR.deleteMany({
        where: {
          objective: {
            cycle: {
              department: companyScope,
            },
          },
        },
      });

      await tx.objective.deleteMany({
        where: {
          cycle: {
            department: companyScope,
          },
        },
      });

      await tx.strategicCycle.deleteMany({
        where: {
          department: companyScope,
        },
      });

      await tx.user.deleteMany({
        where: companyScope,
      });

      await tx.department.deleteMany({
        where: companyScope,
      });

      await tx.company.delete({
        where: {
          id: companyId,
        },
      });
    });

    return {
      success: true,
      redirectTo: '/login',
    };
  }

  private assertDirector(role: UserRole) {
    if (role !== UserRole.DIRECTOR) {
      throw new ForbiddenException('Access denied');
    }
  }

  private async getActorSettingsContext(actor: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      include: {
        company: true,
        department: true,
        settings: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private buildResponse(
    user: Awaited<ReturnType<SettingsService['getActorSettingsContext']>>,
  ): SettingsResponse {
    return {
      scope: this.dashboardDomainService.getScope(user.role),
      role: user.role,
      permissions: this.dashboardDomainService.getPermissions(user.role),
      context: this.buildContext(user),
      settings: user.settings
        ? {
            theme: user.settings.theme,
            language: user.settings.language,
            emailNotifications: user.settings.emailNotifications,
            inviteNotifications: user.settings.inviteNotifications,
            okrNotifications: user.settings.okrNotifications,
            cycleNotifications: user.settings.cycleNotifications,
          }
        : defaultPersonalSettings,
      company: user.company
        ? this.buildCompanySettings(user.company, user.role === UserRole.DIRECTOR)
        : null,
      security: {
        profilePath: '/profile',
        lastAccessAt: user.lastAccessAt?.toISOString() ?? null,
      },
      meta: {
        canManageCompany: user.role === UserRole.DIRECTOR,
        dangerZoneAvailable:
          user.role === UserRole.DIRECTOR ? Boolean(user.companyId) : false,
        dangerZoneMessage:
          user.role === UserRole.DIRECTOR
            ? 'A exclusao da empresa remove permanentemente todos os dados vinculados.'
            : 'Nenhuma acao critica disponivel para este perfil. Alteracoes de vinculo e remocao de conta devem ser realizadas pelo Diretor da empresa.',
        companyDeletion:
          user.role === UserRole.DIRECTOR && user.companyId
            ? {
                enabled: true,
                requiresPasswordConfirmation: user.hasUsablePassword,
                requiresDirectorEmailConfirmation: !user.hasUsablePassword,
              }
            : null,
      },
    };
  }

  private buildContext(user: {
    id: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    company: { id: string; name: string; businessArea: string } | null;
    department: { id: string; name: string } | null;
  }): SettingsContext {
    return {
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            businessArea: user.company.businessArea,
          }
        : null,
      department: user.department
        ? {
            id: user.department.id,
            name: user.department.name,
          }
        : null,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    };
  }

  private buildCompanySettings(
    company: {
      id: string;
      name: string;
      cnpj: string;
      businessArea: string;
    },
    canEdit: boolean,
  ): CompanySettings {
    return {
      id: company.id,
      name: company.name,
      cnpj: company.cnpj,
      businessArea: company.businessArea,
      canEdit,
    };
  }

  private async buildCompanyDeletionSummary(companyId: string) {
    const [users, departments, cycles, objectives, okrs, progressUpdates, invites, settings] =
      await Promise.all([
        this.prisma.user.count({
          where: { companyId },
        }),
        this.prisma.department.count({
          where: { companyId },
        }),
        this.prisma.strategicCycle.count({
          where: {
            department: { companyId },
          },
        }),
        this.prisma.objective.count({
          where: {
            cycle: {
              department: { companyId },
            },
          },
        }),
        this.prisma.oKR.count({
          where: {
            objective: {
              cycle: {
                department: { companyId },
              },
            },
          },
        }),
        this.prisma.progressOKR.count({
          where: {
            OR: [
              {
                actor: { companyId },
              },
              {
                okr: {
                  objective: {
                    cycle: {
                      department: { companyId },
                    },
                  },
                },
              },
            ],
          },
        }),
        this.prisma.invite.count({
          where: { companyId },
        }),
        this.prisma.userSettings.count({
          where: {
            user: { companyId },
          },
        }),
      ]);

    return {
      users,
      departments,
      cycles,
      objectives,
      okrs,
      progressUpdates,
      invites,
      settings,
    };
  }

  private extractPersonalSettings(
    settings:
      | {
          theme: ThemePreference;
          language: string;
          emailNotifications: boolean;
          inviteNotifications: boolean;
          okrNotifications: boolean;
          cycleNotifications: boolean;
        }
      | null
      | undefined,
  ) {
    return {
      theme: settings?.theme ?? defaultPersonalSettings.theme,
      language: settings?.language ?? defaultPersonalSettings.language,
      emailNotifications: settings?.emailNotifications ?? defaultPersonalSettings.emailNotifications,
      inviteNotifications:
        settings?.inviteNotifications ?? defaultPersonalSettings.inviteNotifications,
      okrNotifications: settings?.okrNotifications ?? defaultPersonalSettings.okrNotifications,
      cycleNotifications:
        settings?.cycleNotifications ?? defaultPersonalSettings.cycleNotifications,
    };
  }
}
