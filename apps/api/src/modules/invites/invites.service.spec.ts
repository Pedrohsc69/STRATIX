import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { InvitesService } from './invites.service';

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
    { execute: async () => undefined } as never,
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
  const service = new InvitesService(
    {} as never,
    { sendInviteEmail: async () => undefined } as never,
    { execute: async () => undefined } as never,
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
          return { companyId: 'company-1' };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({ id: 'department-1' }),
    },
    invite: {
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
    { execute: async () => undefined } as never,
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

void test('InvitesService deletes expired invites, audits the replacement and sends the new e-mail', async () => {
  const deletedInviteIds: string[] = [];
  const auditCommands: Array<Record<string, unknown>> = [];
  const sentMessages: Array<Record<string, unknown>> = [];

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
      findFirst: async () => ({ id: 'department-1', name: 'Comercial' }),
    },
    invite: {
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
      sendInviteEmail: async (message: Record<string, unknown>) => {
        sentMessages.push(message);
      },
    } as never,
    {
      execute: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    } as never,
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
  assert.equal(auditCommands[0]?.action, 'invite.expired.replaced');
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0]?.token, 'new-token');
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
      findFirst: async () => ({ id: 'department-1', name: 'Comercial' }),
    },
    invite: {
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
      execute: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    } as never,
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
  assert.equal(auditCommands.length, 1);
  assert.equal(auditCommands[0]?.action, 'invite.email.failed');
});
