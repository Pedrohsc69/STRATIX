import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InterfaceDensity,
  ThemePreference,
  UserRole,
  type UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../core/shared/prisma.service';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import type { AuditRequestContext } from '../audit/audit.types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { UpdateMySettingsDto } from './dto/update-my-settings.dto';
import type {
  CompanySettings,
  PersonalSettings,
  SettingsContext,
  SettingsResponse,
} from './settings.types';

const defaultPersonalSettings: PersonalSettings = {
  theme: ThemePreference.SYSTEM,
  density: InterfaceDensity.COMFORTABLE,
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
        density: input.density ?? defaultPersonalSettings.density,
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
        ...(input.density ? { density: input.density } : {}),
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
      ...(input.density ? { density: input.density } : {}),
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
            density: user.settings.density,
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
        dangerZoneAvailable: false,
        dangerZoneMessage:
          user.role === UserRole.DIRECTOR
            ? 'Acoes administrativas criticas ainda nao estao disponiveis com seguranca.'
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

  private extractPersonalSettings(
    settings:
      | {
          theme: ThemePreference;
          density: InterfaceDensity;
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
      density: settings?.density ?? defaultPersonalSettings.density,
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
