import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ThemePreference, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { SettingsService } from './settings.service';
import type { PersonalSettings } from './settings.types';

function createActor(
  overrides?: Partial<{
    id: string;
    email: string;
    role: UserRole;
    companyId: string | null;
    departmentId: string | null;
    hasUsablePassword: boolean;
    password: string;
    settings: PersonalSettings | null;
  }>,
) {
  return {
    id: overrides?.id ?? 'user-1',
    name: 'Ana',
    email: overrides?.email ?? 'ana@empresa.com',
    password: overrides?.password ?? 'hashed-password',
    hasUsablePassword: overrides?.hasUsablePassword ?? true,
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
    settings: overrides?.settings ?? null,
  };
}

void test('SettingsService returns the authenticated user settings with defaults and company deletion metadata', async () => {
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
  assert.equal(response.settings.language, 'pt-BR');
  assert.equal(response.security.profilePath, '/profile');
  assert.equal(response.company?.name, 'Empresa X');
  assert.deepEqual(response.meta.companyDeletion, {
    enabled: true,
    requiresPasswordConfirmation: true,
    requiresDirectorEmailConfirmation: false,
  });
});

void test('SettingsService updates the authenticated user preferences without density', async () => {
  const storedUser: Omit<ReturnType<typeof createActor>, 'settings'> & {
    settings: PersonalSettings;
  } = {
    ...createActor(),
    settings: {
      theme: ThemePreference.SYSTEM,
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
          language: 'pt-BR',
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
      language: 'pt-BR',
      emailNotifications: false,
    },
  );

  assert.ok(receivedUpsert);
  assert.equal(JSON.stringify(receivedUpsert).includes('density'), false);
  assert.equal(response.settings.theme, ThemePreference.DARK);
  assert.equal(response.settings.emailNotifications, false);
});

void test('SettingsService deletes the director company with correct confirmation and transaction order', async () => {
  const passwordHash = await bcrypt.hash('senha123', 10);
  const operationOrder: string[] = [];
  const auditCommands: Array<Record<string, unknown>> = [];

  const prisma = {
    user: {
      findUnique: async () =>
        createActor({
          password: passwordHash,
          hasUsablePassword: true,
        }),
      deleteMany: async () => {
        operationOrder.push('user.deleteMany');
      },
      count: async () => 3,
    },
    department: {
      count: async () => 2,
    },
    strategicCycle: {
      count: async () => 2,
    },
    objective: {
      count: async () => 4,
    },
    oKR: {
      count: async () => 5,
    },
    progressOKR: {
      count: async () => 8,
    },
    invite: {
      count: async () => 2,
    },
    userSettings: {
      count: async () => 1,
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        progressOKR: {
          deleteMany: async () => {
            operationOrder.push('progressOKR.deleteMany');
          },
        },
        passwordResetToken: {
          deleteMany: async () => {
            operationOrder.push('passwordResetToken.deleteMany');
          },
        },
        userSettings: {
          deleteMany: async () => {
            operationOrder.push('userSettings.deleteMany');
          },
        },
        invite: {
          deleteMany: async () => {
            operationOrder.push('invite.deleteMany');
          },
        },
        department: {
          updateMany: async () => {
            operationOrder.push('department.updateMany');
          },
          deleteMany: async () => {
            operationOrder.push('department.deleteMany');
          },
        },
        oKR: {
          deleteMany: async () => {
            operationOrder.push('oKR.deleteMany');
          },
        },
        objective: {
          deleteMany: async () => {
            operationOrder.push('objective.deleteMany');
          },
        },
        strategicCycle: {
          deleteMany: async () => {
            operationOrder.push('strategicCycle.deleteMany');
          },
        },
        user: {
          deleteMany: async () => {
            operationOrder.push('user.deleteMany');
          },
        },
        company: {
          delete: async () => {
            operationOrder.push('company.delete');
          },
        },
      }),
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    } as never,
  );

  const response = await service.deleteCompany(
    { sub: 'user-1', email: 'ana@empresa.com', role: UserRole.DIRECTOR },
    {
      companyNameConfirmation: 'Empresa X',
      currentPassword: 'senha123',
    },
  );

  assert.deepEqual(response, {
    success: true,
    redirectTo: '/login',
  });
  assert.equal(auditCommands[0]?.action, 'COMPANY_DELETED');
  assert.deepEqual(operationOrder, [
    'progressOKR.deleteMany',
    'passwordResetToken.deleteMany',
    'userSettings.deleteMany',
    'invite.deleteMany',
    'department.updateMany',
    'oKR.deleteMany',
    'objective.deleteMany',
    'strategicCycle.deleteMany',
    'user.deleteMany',
    'department.deleteMany',
    'company.delete',
  ]);
});

void test('SettingsService rejects company deletion with incorrect company confirmation', async () => {
  const prisma = {
    user: {
      findUnique: async () => createActor(),
    },
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );

  await assert.rejects(
    () =>
      service.deleteCompany(
        { sub: 'user-1', email: 'ana@empresa.com', role: UserRole.DIRECTOR },
        {
          companyNameConfirmation: 'Empresa Y',
          currentPassword: 'senha123',
        },
      ),
    BadRequestException,
  );
});

void test('SettingsService rejects company deletion with invalid password for local account', async () => {
  const passwordHash = await bcrypt.hash('senha123', 10);
  const prisma = {
    user: {
      findUnique: async () =>
        createActor({
          password: passwordHash,
          hasUsablePassword: true,
        }),
    },
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );

  await assert.rejects(
    () =>
      service.deleteCompany(
        { sub: 'user-1', email: 'ana@empresa.com', role: UserRole.DIRECTOR },
        {
          companyNameConfirmation: 'Empresa X',
          currentPassword: 'senha-errada',
        },
      ),
    UnauthorizedException,
  );
});

void test('SettingsService allows Google-style deletion with company name plus director email', async () => {
  const operationOrder: string[] = [];

  const prisma = {
    user: {
      findUnique: async () =>
        createActor({
          hasUsablePassword: false,
          email: 'diretor.google@empresa.com',
        }),
      count: async () => 1,
    },
    department: {
      count: async () => 0,
    },
    strategicCycle: {
      count: async () => 0,
    },
    objective: {
      count: async () => 0,
    },
    oKR: {
      count: async () => 0,
    },
    progressOKR: {
      count: async () => 0,
    },
    invite: {
      count: async () => 0,
    },
    userSettings: {
      count: async () => 0,
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        progressOKR: { deleteMany: async () => operationOrder.push('progressOKR.deleteMany') },
        passwordResetToken: {
          deleteMany: async () => operationOrder.push('passwordResetToken.deleteMany'),
        },
        userSettings: {
          deleteMany: async () => operationOrder.push('userSettings.deleteMany'),
        },
        invite: { deleteMany: async () => operationOrder.push('invite.deleteMany') },
        department: {
          updateMany: async () => operationOrder.push('department.updateMany'),
          deleteMany: async () => operationOrder.push('department.deleteMany'),
        },
        oKR: { deleteMany: async () => operationOrder.push('oKR.deleteMany') },
        objective: { deleteMany: async () => operationOrder.push('objective.deleteMany') },
        strategicCycle: {
          deleteMany: async () => operationOrder.push('strategicCycle.deleteMany'),
        },
        user: { deleteMany: async () => operationOrder.push('user.deleteMany') },
        company: { delete: async () => operationOrder.push('company.delete') },
      }),
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );

  const response = await service.deleteCompany(
    { sub: 'user-1', email: 'diretor.google@empresa.com', role: UserRole.DIRECTOR },
    {
      companyNameConfirmation: 'Empresa X',
      directorEmailConfirmation: 'diretor.google@empresa.com',
    },
  );

  assert.equal(response.success, true);
  assert.equal(operationOrder.includes('company.delete'), true);
});

void test('SettingsService blocks company deletion for manager', async () => {
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
      service.deleteCompany(
        { sub: 'user-1', email: 'ana@empresa.com', role: UserRole.MANAGER },
        { companyNameConfirmation: 'Empresa X' },
      ),
    ForbiddenException,
  );
});

void test('SettingsService blocks company deletion for employee', async () => {
  const prisma = {
    user: {
      findUnique: async () => createActor({ role: UserRole.EMPLOYEE }),
    },
  };

  const service = new SettingsService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );

  await assert.rejects(
    () =>
      service.deleteCompany(
        { sub: 'user-1', email: 'ana@empresa.com', role: UserRole.EMPLOYEE },
        { companyNameConfirmation: 'Empresa X' },
      ),
    ForbiddenException,
  );
});
