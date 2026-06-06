import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  InterfaceDensity,
  ThemePreference,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { SettingsService } from './settings.service';
import type { PersonalSettings } from './settings.types';

function createActor(overrides?: Partial<{
  id: string;
  role: UserRole;
  companyId: string | null;
  departmentId: string | null;
}>) {
  return {
    id: overrides?.id ?? 'user-1',
    name: 'Ana',
    email: 'ana@empresa.com',
    role: overrides?.role ?? UserRole.DIRECTOR,
    status: UserStatus.ACTIVE,
    companyId: overrides?.companyId ?? 'company-1',
    departmentId: overrides?.departmentId ?? 'department-1',
    lastAccessAt: new Date('2026-06-01T10:00:00.000Z'),
    company:
      overrides?.companyId === null
        ? null
        : {
            id: overrides?.companyId ?? 'company-1',
            name: 'Empresa X',
            cnpj: '12345678000199',
            businessArea: 'Tecnologia',
          },
    department:
      overrides?.departmentId === null
        ? null
        : {
            id: overrides?.departmentId ?? 'department-1',
            name: 'Operacoes',
          },
    settings: null,
  };
}

void test('SettingsService returns the authenticated user settings with defaults', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        assert.equal(where.id, 'user-1');
        return createActor();
      },
    },
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );
  const response = await service.getMe({
    sub: 'user-1',
    email: 'ana@empresa.com',
    role: UserRole.DIRECTOR,
  });

  assert.equal(response.settings.theme, ThemePreference.SYSTEM);
  assert.equal(response.security.profilePath, '/profile');
  assert.equal(response.company?.name, 'Empresa X');
});

void test('SettingsService updates the authenticated user preferences', async () => {
  const storedUser: Omit<ReturnType<typeof createActor>, 'settings'> & {
    settings: PersonalSettings;
  } = {
    ...createActor(),
    settings: {
      theme: ThemePreference.SYSTEM,
      density: InterfaceDensity.COMFORTABLE,
      language: 'pt-BR',
      emailNotifications: true,
      inviteNotifications: true,
      okrNotifications: true,
      cycleNotifications: true,
    },
  };

  let receivedUpsert: Record<string, unknown> | null = null;

  const prisma = {
    user: {
      findUnique: async () => storedUser,
    },
    userSettings: {
      upsert: async (input: Record<string, unknown>) => {
        receivedUpsert = input;
        storedUser.settings = {
          ...storedUser.settings,
          theme: ThemePreference.DARK,
          density: InterfaceDensity.COMPACT,
          emailNotifications: false,
        };
        return storedUser.settings;
      },
    },
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );
  const response = await service.updateMe(
    { sub: 'user-1', email: 'ana@empresa.com', role: UserRole.DIRECTOR },
    {
      theme: ThemePreference.DARK,
      density: InterfaceDensity.COMPACT,
      emailNotifications: false,
    },
  );

  assert.ok(receivedUpsert);
  assert.equal(response.settings.theme, ThemePreference.DARK);
  assert.equal(response.settings.density, InterfaceDensity.COMPACT);
  assert.equal(response.settings.emailNotifications, false);
});

void test('SettingsService returns company settings only for directors', async () => {
  const prisma = {
    user: {
      findUnique: async () => createActor({ role: UserRole.DIRECTOR }),
    },
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );
  const response = await service.getCompany({
    sub: 'user-1',
    email: 'ana@empresa.com',
    role: UserRole.DIRECTOR,
  });

  assert.equal(response.canEdit, true);
  assert.equal(response.cnpj, '12345678000199');
});

void test('SettingsService updates company settings for the director company only', async () => {
  let updatedCompanyData: Record<string, unknown> | null = null;

  const prisma = {
    user: {
      findUnique: async () => createActor({ role: UserRole.DIRECTOR }),
    },
    company: {
      findFirst: async () => null,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        updatedCompanyData = data;
        return {
          id: 'company-1',
          name: (data.name as string) ?? 'Empresa X',
          cnpj: (data.cnpj as string) ?? '12345678000199',
          businessArea: (data.businessArea as string) ?? 'Tecnologia',
        };
      },
    },
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );
  const response = await service.updateCompany(
    { sub: 'user-1', email: 'ana@empresa.com', role: UserRole.DIRECTOR },
    {
      name: 'Empresa Atualizada',
      businessArea: 'Financeiro',
      cnpj: '12.345.678/0001-90',
    },
  );

  assert.deepEqual(updatedCompanyData, {
    name: 'Empresa Atualizada',
    businessArea: 'Financeiro',
    cnpj: '12345678000190',
  });
  assert.equal(response.name, 'Empresa Atualizada');
});

void test('SettingsService blocks company updates for manager and employee roles', async () => {
  const prisma = {
    user: {
      findUnique: async () => createActor({ role: UserRole.MANAGER }),
    },
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );

  await assert.rejects(
    () =>
      service.updateCompany(
        { sub: 'user-1', email: 'ana@empresa.com', role: UserRole.MANAGER },
        { name: 'Invalido' },
      ),
    ForbiddenException,
  );
});

void test('SettingsService rejects invalid company values', async () => {
  const prisma = {
    user: {
      findUnique: async () => createActor({ role: UserRole.DIRECTOR }),
    },
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );

  await assert.rejects(
    () =>
      service.updateCompany(
        { sub: 'user-1', email: 'ana@empresa.com', role: UserRole.DIRECTOR },
        { cnpj: '123' },
      ),
    BadRequestException,
  );
});
