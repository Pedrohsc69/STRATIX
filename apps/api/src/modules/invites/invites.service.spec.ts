import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import type { InviteEmailPayload } from '../messaging/messaging.types';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

function createInviteConfigService(overrides?: Record<string, string>) {
  const values = {
    EMAIL_DEMO_MODE: 'false',
    FRONTEND_URL: 'http://localhost:5173',
    RABBITMQ_ENABLED: 'false',
    ...overrides,
  };

  return {
    get: (key: string) => values[key as keyof typeof values],
  };
}

void test('CreateInviteDto no longer requires name and only allows manager or employee roles', async () => {
  const validDto = plainToInstance(CreateInviteDto, {
    email: 'colaborador@empresa.com',
    role: UserRole.EMPLOYEE,
    departmentId: '550e8400-e29b-41d4-a716-446655440000',
  });

  const validErrors = await validate(validDto);
  assert.deepEqual(validErrors, []);

  const invalidRoleDto = plainToInstance(CreateInviteDto, {
    email: 'diretor@empresa.com',
    role: UserRole.DIRECTOR,
    departmentId: '550e8400-e29b-41d4-a716-446655440000',
  });

  const invalidRoleErrors = await validate(invalidRoleDto);
  assert.equal(invalidRoleErrors.some((error) => error.property === 'role'), true);
});

void test('InvitesService requires at least one department before creating invites', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({ companyId: 'company-1' }),
    },
    department: {
      count: async () => 0,
    },
  };

  const service = new InvitesService(
    prisma as never,
    { sendInviteEmail: async () => undefined } as never,
    { log: async () => undefined } as never,
    undefined,
    createInviteConfigService() as never,
  );

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          email: 'colaborador@empresa.com',
          role: UserRole.EMPLOYEE,
          departmentId: 'department-1',
        },
      ),
    BadRequestException,
  );
});

void test('InvitesService rejects director invites', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        company: { name: 'Empresa X' },
      }),
    },
    department: {
      count: async () => 1,
    },
  };

  const service = new InvitesService(
    prisma as never,
    { sendInviteEmail: async () => undefined } as never,
    { log: async () => undefined } as never,
    undefined,
    createInviteConfigService() as never,
  );

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          email: 'gestor@empresa.com',
          role: UserRole.DIRECTOR,
          departmentId: 'department-1',
        },
      ),
    BadRequestException,
  );
});

void test('InvitesService rejects duplicate invite e-mail', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where?: { id?: string; email?: string } }) => {
        if (where?.id) {
          return { companyId: 'company-1', company: { name: 'Empresa X' } };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({ id: 'department-1', name: 'Comercial', managerId: null }),
    },
    invite: {
      findFirst: async () => null,
      findUnique: async () => ({
        id: 'invite-1',
        email: 'gestor@empresa.com',
        role: UserRole.MANAGER,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'active-token',
        expiresAt: new Date(Date.now() + 1000 * 60),
      }),
    },
  };

  const service = new InvitesService(
    prisma as never,
    { sendInviteEmail: async () => undefined } as never,
    { log: async () => undefined } as never,
    undefined,
    createInviteConfigService() as never,
  );

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          email: 'gestor@empresa.com',
          role: UserRole.MANAGER,
          departmentId: 'department-1',
        },
      ),
    ConflictException,
  );
});

void test('InvitesService replaces expired invites and audits INVITE_SENT without token data', async () => {
  const deletedInviteIds: string[] = [];
  const auditCommands: Array<Record<string, unknown>> = [];
  const sentMessages: InviteEmailPayload[] = [];

  const prisma = {
    user: {
      findUnique: async ({ where }: { where?: { id?: string; email?: string } }) => {
        if (where?.id) {
          return {
            companyId: 'company-1',
            company: { name: 'Empresa X' },
          };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({ id: 'department-1', name: 'Comercial', managerId: null }),
    },
    invite: {
      findFirst: async () => null,
      findUnique: async () => ({
        id: 'invite-expired',
        email: 'gestor@empresa.com',
        role: UserRole.MANAGER,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
      }),
      delete: async ({ where }: { where: { id: string } }) => {
        deletedInviteIds.push(where.id);
      },
      create: async () => ({
        id: 'invite-new',
        email: 'gestor@empresa.com',
        role: UserRole.MANAGER,
        departmentId: 'department-1',
        companyId: 'company-1',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000),
        createdAt: new Date(),
        token: 'new-token',
      }),
    },
  };

  const service = new InvitesService(
    prisma as never,
    {
      sendInviteEmail: async (message: InviteEmailPayload) => {
        sentMessages.push(message);
      },
    } as never,
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    } as never,
    undefined,
    createInviteConfigService() as never,
  );

  const invite = await service.create(
    { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
    {
      email: 'gestor@empresa.com',
      role: UserRole.MANAGER,
      departmentId: 'department-1',
    },
  );

  assert.equal(invite.id, 'invite-new');
  assert.deepEqual(deletedInviteIds, ['invite-expired']);
  assert.equal(auditCommands.length, 1);
  assert.equal(auditCommands[0]?.action, 'INVITE_SENT');
  assert.equal(JSON.stringify(auditCommands[0]).includes('tokenHash'), false);
  assert.equal(JSON.stringify(auditCommands[0]).includes('"token"'), false);
  assert.equal(sentMessages.length, 1);
  assert.match(sentMessages[0]?.inviteUrl ?? '', /accept-invite\?token=new-token/);
  assert.equal(invite.inviteUrl, undefined);
});

void test('InvitesService skips Resend and returns inviteUrl when EMAIL_DEMO_MODE is enabled', async () => {
  const auditCommands: Array<Record<string, unknown>> = [];
  let emailSendAttempts = 0;

  const prisma = {
    user: {
      findUnique: async ({ where }: { where?: { id?: string; email?: string } }) => {
        if (where?.id) {
          return {
            companyId: 'company-1',
            company: { name: 'Empresa X' },
          };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({ id: 'department-1', name: 'Comercial', managerId: null }),
    },
    invite: {
      findUnique: async () => null,
      create: async () => ({
        id: 'invite-demo',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        departmentId: 'department-1',
        companyId: 'company-1',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000 * 60),
        createdAt: new Date('2026-06-10T12:00:00.000Z'),
        token: 'demo-token',
      }),
    },
  };

  const service = new InvitesService(
    prisma as never,
    {
      sendInviteEmail: async () => {
        emailSendAttempts += 1;
      },
    } as never,
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    } as never,
    undefined,
    createInviteConfigService({ EMAIL_DEMO_MODE: 'true' }) as never,
  );

  const invite = await service.create(
    { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
    {
      email: 'colaborador@empresa.com',
      role: UserRole.EMPLOYEE,
      departmentId: 'department-1',
    },
  );

  assert.equal(emailSendAttempts, 0);
  assert.equal(
    invite.inviteUrl,
    'http://localhost:5173/accept-invite?token=demo-token',
  );
  assert.equal(auditCommands.length, 1);
  assert.equal(JSON.stringify(auditCommands[0]).includes('"token"'), false);
});

void test('InvitesService deletes the invite when e-mail delivery fails', async () => {
  const deletedInviteIds: string[] = [];
  const auditCommands: Array<Record<string, unknown>> = [];

  const prisma = {
    user: {
      findUnique: async ({ where }: { where?: { id?: string; email?: string } }) => {
        if (where?.id) {
          return {
            companyId: 'company-1',
            company: { name: 'Empresa X' },
          };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({ id: 'department-1', name: 'Comercial', managerId: null }),
    },
    invite: {
      findFirst: async () => null,
      findUnique: async () => null,
      create: async () => ({
        id: 'invite-new',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        departmentId: 'department-1',
        companyId: 'company-1',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000),
        createdAt: new Date(),
        token: 'new-token',
      }),
      delete: async ({ where }: { where: { id: string } }) => {
        deletedInviteIds.push(where.id);
      },
    },
  };

  const service = new InvitesService(
    prisma as never,
    {
      sendInviteEmail: async () => {
        throw new Error('provider down');
      },
    } as never,
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    } as never,
    undefined,
    createInviteConfigService() as never,
  );

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          email: 'colaborador@empresa.com',
          role: UserRole.EMPLOYEE,
          departmentId: 'department-1',
        },
      ),
    InternalServerErrorException,
  );

  assert.deepEqual(deletedInviteIds, ['invite-new']);
  assert.equal(auditCommands.length, 0);
});

void test('InvitesService rejects invites for departments outside the director company', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where?: { id?: string; email?: string } }) => {
        if (where?.id) {
          return {
            companyId: 'company-1',
            company: { name: 'Empresa X' },
          };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => null,
    },
  };

  const service = new InvitesService(
    prisma as never,
    { sendInviteEmail: async () => undefined } as never,
    { log: async () => undefined } as never,
    undefined,
    createInviteConfigService() as never,
  );

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          email: 'colaborador@empresa.com',
          role: UserRole.EMPLOYEE,
          departmentId: 'department-2',
        },
      ),
    BadRequestException,
  );
});

void test('InvitesService rejects manager invites when the department already has a manager', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where?: { id?: string; email?: string } }) => {
        if (where?.id) {
          return {
            companyId: 'company-1',
            company: { name: 'Empresa X' },
          };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({
        id: 'department-1',
        name: 'Comercial',
        managerId: 'manager-1',
      }),
    },
  };

  const service = new InvitesService(
    prisma as never,
    { sendInviteEmail: async () => undefined } as never,
    { log: async () => undefined } as never,
    undefined,
    createInviteConfigService() as never,
  );

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          email: 'novo-gestor@empresa.com',
          role: UserRole.MANAGER,
          departmentId: 'department-1',
        },
      ),
    ConflictException,
  );
});

void test('InvitesService rejects a second active manager invite for the same department', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where?: { id?: string; email?: string } }) => {
        if (where?.id) {
          return {
            companyId: 'company-1',
            company: { name: 'Empresa X' },
          };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({
        id: 'department-1',
        name: 'Comercial',
        managerId: null,
      }),
    },
    invite: {
      findFirst: async () => ({
        id: 'invite-1',
      }),
      findUnique: async () => null,
    },
  };

  const service = new InvitesService(
    prisma as never,
    { sendInviteEmail: async () => undefined } as never,
    { log: async () => undefined } as never,
    undefined,
    createInviteConfigService() as never,
  );

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          email: 'novo-gestor@empresa.com',
          role: UserRole.MANAGER,
          departmentId: 'department-1',
        },
      ),
    ConflictException,
  );
});

void test('InvitesService resends an active invite without changing the token', async () => {
  const sentMessages: InviteEmailPayload[] = [];
  const auditCommands: Array<Record<string, unknown>> = [];

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  const prisma = {
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        company: { name: 'Empresa X' },
      }),
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({
        id: 'department-1',
        name: 'Comercial',
        managerId: null,
      }),
    },
    invite: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        if (typeof where.id === 'string') {
          return {
            id: 'invite-1',
            email: 'gestor@empresa.com',
            role: UserRole.MANAGER,
            companyId: 'company-1',
            departmentId: 'department-1',
            token: 'active-token',
            accepted: false,
            expiresAt,
            createdAt: new Date('2026-05-01T10:00:00.000Z'),
            department: {
              id: 'department-1',
              name: 'Comercial',
              managerId: null,
            },
          };
        }

        return null;
      },
      update: async ({ data }: { data: { token: string; expiresAt: Date } }) => ({
        id: 'invite-1',
        email: 'gestor@empresa.com',
        role: UserRole.MANAGER,
        accepted: false,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        department: {
          id: 'department-1',
          name: 'Comercial',
        },
      }),
    },
  };

  const service = new InvitesService(
    prisma as never,
    {
      sendInviteEmail: async (message: InviteEmailPayload) => {
        sentMessages.push(message);
      },
    } as never,
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    } as never,
    undefined,
    createInviteConfigService() as never,
  );

  const invite = await service.resend(
    { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
    'invite-1',
  );

  assert.equal(invite.status, 'PENDING');
  assert.match(sentMessages[0]?.inviteUrl ?? '', /accept-invite\?token=active-token/);
  assert.equal(auditCommands[0]?.action, 'INVITE_RESENT');
  assert.equal(JSON.stringify(auditCommands[0]).includes('tokenHash'), false);
  assert.equal(JSON.stringify(auditCommands[0]).includes('"token"'), false);
});

void test('InvitesService renews the token when resending an expired invite', async () => {
  const sentMessages: InviteEmailPayload[] = [];

  const prisma = {
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        company: { name: 'Empresa X' },
      }),
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({
        id: 'department-1',
        name: 'Comercial',
        managerId: null,
      }),
    },
    invite: {
      findFirst: async () => ({
        id: 'invite-1',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'expired-token',
        accepted: false,
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        department: {
          id: 'department-1',
          name: 'Comercial',
          managerId: null,
        },
      }),
      update: async ({ data }: { data: { token: string; expiresAt: Date } }) => ({
        id: 'invite-1',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        accepted: false,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        department: {
          id: 'department-1',
          name: 'Comercial',
        },
      }),
    },
  };

  const service = new InvitesService(
    prisma as never,
    {
      sendInviteEmail: async (message: InviteEmailPayload) => {
        sentMessages.push(message);
      },
    } as never,
    { log: async () => undefined } as never,
    undefined,
    createInviteConfigService() as never,
  );

  await service.resend(
    { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
    'invite-1',
  );

  assert.equal(sentMessages[0]?.inviteUrl.includes('expired-token'), false);
});

void test('InvitesService does not resend an accepted invite', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        company: { name: 'Empresa X' },
      }),
    },
    department: {
      count: async () => 1,
    },
    invite: {
      findFirst: async () => ({
        id: 'invite-1',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'token-1',
        accepted: true,
        expiresAt: new Date(Date.now() + 1000),
        createdAt: new Date(),
        department: {
          id: 'department-1',
          name: 'Comercial',
          managerId: null,
        },
      }),
    },
  };

  const service = new InvitesService(
    prisma as never,
    { sendInviteEmail: async () => undefined } as never,
    { log: async () => undefined } as never,
    undefined,
    createInviteConfigService() as never,
  );

  await assert.rejects(
    () =>
      service.resend(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        'invite-1',
      ),
    ConflictException,
  );
});

void test('InvitesService publishes invite e-mails to RabbitMQ when enabled', async () => {
  const publishedMessages: InviteEmailPayload[] = [];
  let emailSendAttempts = 0;

  const prisma = {
    user: {
      findUnique: async ({ where }: { where?: { id?: string; email?: string } }) => {
        if (where?.id) {
          return {
            companyId: 'company-1',
            company: { name: 'Empresa X' },
          };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({ id: 'department-1', name: 'Comercial', managerId: null }),
    },
    invite: {
      findFirst: async () => null,
      findUnique: async () => null,
      create: async () => ({
        id: 'invite-rabbit',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        departmentId: 'department-1',
        companyId: 'company-1',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000),
        createdAt: new Date('2026-06-12T10:00:00.000Z'),
        token: 'rabbit-token',
      }),
    },
  };

  const service = new InvitesService(
    prisma as never,
    {
      sendInviteEmail: async () => {
        emailSendAttempts += 1;
      },
    } as never,
    { log: async () => undefined } as never,
    {
      publish: async (payload: InviteEmailPayload) => {
        publishedMessages.push(payload);
      },
    } as never,
    createInviteConfigService({ RABBITMQ_ENABLED: 'true' }) as never,
  );

  await service.create(
    { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
    {
      email: 'colaborador@empresa.com',
      role: UserRole.EMPLOYEE,
      departmentId: 'department-1',
    },
  );

  assert.equal(emailSendAttempts, 0);
  assert.equal(publishedMessages.length, 1);
  assert.equal(publishedMessages[0]?.inviteId, 'invite-rabbit');
  assert.equal(publishedMessages[0]?.inviteUrl.includes('rabbit-token'), true);
  assert.equal(JSON.stringify(publishedMessages[0]).includes('"token"'), false);
});

void test('InvitesService falls back to synchronous e-mail delivery when RabbitMQ publish fails without deleting the invite', async () => {
  const deletedInviteIds: string[] = [];
  const sentMessages: InviteEmailPayload[] = [];

  const prisma = {
    user: {
      findUnique: async ({ where }: { where?: { id?: string; email?: string } }) => {
        if (where?.id) {
          return {
            companyId: 'company-1',
            company: { name: 'Empresa X' },
          };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({ id: 'department-1', name: 'Comercial', managerId: null }),
    },
    invite: {
      findFirst: async () => null,
      findUnique: async () => null,
      create: async () => ({
        id: 'invite-fallback',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        departmentId: 'department-1',
        companyId: 'company-1',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000),
        createdAt: new Date('2026-06-12T10:00:00.000Z'),
        token: 'fallback-token',
      }),
      delete: async ({ where }: { where: { id: string } }) => {
        deletedInviteIds.push(where.id);
      },
    },
  };

  const service = new InvitesService(
    prisma as never,
    {
      sendInviteEmail: async (payload: InviteEmailPayload) => {
        sentMessages.push(payload);
      },
    } as never,
    { log: async () => undefined } as never,
    {
      publish: async () => {
        throw new Error('rabbit down');
      },
    } as never,
    createInviteConfigService({ RABBITMQ_ENABLED: 'true' }) as never,
  );

  await service.create(
    { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
    {
      email: 'colaborador@empresa.com',
      role: UserRole.EMPLOYEE,
      departmentId: 'department-1',
    },
  );

  assert.deepEqual(deletedInviteIds, []);
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0]?.inviteId, 'invite-fallback');
});

void test('InvitesController protects create, list, details and resend for directors only', () => {
  const createRoles = Reflect.getMetadata(ROLES_KEY, InvitesController.prototype.create) as UserRole[];
  const listRoles = Reflect.getMetadata(ROLES_KEY, InvitesController.prototype.list) as UserRole[];
  const getRoles = Reflect.getMetadata(ROLES_KEY, InvitesController.prototype.getById) as UserRole[];
  const resendRoles = Reflect.getMetadata(ROLES_KEY, InvitesController.prototype.resend) as UserRole[];

  assert.deepEqual(createRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(listRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(getRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(resendRoles, [UserRole.DIRECTOR]);
});
