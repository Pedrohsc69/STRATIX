import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

void test('AuthService registers a director with hashed password', async () => {
  let createdPassword = '';

  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          return null;
        }

        if (where.id === 'user-1') {
          return {
            id: 'user-1',
            name: 'Diretor',
            email: 'diretor@empresa.com',
            password: createdPassword,
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: null,
            departmentId: null,
            company: null,
          };
        }

        return null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdPassword = String(data.password);

        return {
          id: 'user-1',
          name: data.name,
          email: data.email,
          password: data.password,
          role: UserRole.DIRECTOR,
          status: UserStatus.ACTIVE,
          isActive: true,
          companyId: null,
          departmentId: null,
        };
      },
    },
  };
  const jwtService = {
    signAsync: async () => 'token-1',
  };

  const service = new AuthService(
    prisma as never,
    jwtService as never,
    { execute: async () => undefined } as never,
  );
  const response = await service.registerDirector({
    name: 'Diretor',
    email: 'diretor@empresa.com',
    password: '12345678',
    confirmPassword: '12345678',
  });

  assert.equal(response.accessToken, 'token-1');
  assert.equal(response.user.role, UserRole.DIRECTOR);
  assert.notEqual(createdPassword, '12345678');
  assert.equal(await bcrypt.compare('12345678', createdPassword), true);
});

void test('AuthService rejects duplicate director e-mail', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({ id: 'existing-user' }),
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    { execute: async () => undefined } as never,
  );

  await assert.rejects(
    () =>
      service.registerDirector({
        name: 'Diretor',
        email: 'diretor@empresa.com',
        password: '12345678',
        confirmPassword: '12345678',
      }),
    ConflictException,
  );
});

void test('AuthService rejects invalid login credentials', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === 'diretor@empresa.com') {
          return {
            id: 'user-1',
            name: 'Diretor',
            email: 'diretor@empresa.com',
            password: await bcrypt.hash('senha-correta', 10),
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: null,
            departmentId: null,
          };
        }

        if (where.id === 'user-1') {
          return {
            id: 'user-1',
            name: 'Diretor',
            email: 'diretor@empresa.com',
            password: await bcrypt.hash('senha-correta', 10),
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: null,
            departmentId: null,
            company: null,
          };
        }

        return null;
      },
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    { execute: async () => undefined } as never,
  );

  await assert.rejects(
    () => service.login({ email: 'diretor@empresa.com', password: 'senha-errada' }),
    UnauthorizedException,
  );
});

void test('AuthService accepts a valid invite and activates the account', async () => {
  let createdPassword = '';
  const updatedDepartmentIds: string[] = [];

  const prisma = {
    invite: {
      findUnique: async () => ({
        id: 'invite-1',
        email: 'gestor@empresa.com',
        role: UserRole.MANAGER,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'token-123',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000 * 60),
        company: { name: 'Empresa X' },
        department: { name: 'Comercial' },
      }),
      update: async () => undefined,
    },
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === 'gestor@empresa.com') {
          return null;
        }

        if (where.id === 'user-2') {
          return {
            id: 'user-2',
            name: 'Gestor Comercial',
            email: 'gestor@empresa.com',
            password: createdPassword,
            role: UserRole.MANAGER,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: 'company-1',
            departmentId: 'department-1',
            company: {
              id: 'company-1',
              name: 'Empresa X',
              businessArea: 'Tecnologia',
            },
          };
        }

        return null;
      },
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        department: {
          findUnique: async () => ({
            id: 'department-1',
            companyId: 'company-1',
            managerId: null,
          }),
          update: async ({ where }: { where: { id: string } }) => {
            updatedDepartmentIds.push(where.id);
          },
        },
        user: {
          create: async ({ data }: { data: Record<string, unknown> }) => {
            createdPassword = String(data.password);
            return {
              id: 'user-2',
              name: data.name,
              email: data.email,
              password: data.password,
              role: data.role,
              status: UserStatus.ACTIVE,
              isActive: true,
              companyId: data.companyId,
              departmentId: data.departmentId,
            };
          },
        },
        invite: {
          update: async () => undefined,
        },
      }),
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-accepted' } as never,
    { execute: async () => undefined } as never,
  );

  const response = await service.acceptInvite({
    name: 'Gestor Comercial',
    token: 'token-123',
    password: '12345678',
    confirmPassword: '12345678',
  });

  assert.equal(response.accessToken, 'token-accepted');
  assert.equal(response.user.role, UserRole.MANAGER);
  assert.equal(response.user.companyId, 'company-1');
  assert.equal(response.user.departmentId, 'department-1');
  assert.deepEqual(updatedDepartmentIds, ['department-1']);
  assert.equal(await bcrypt.compare('12345678', createdPassword), true);
});

void test('AuthService accepts an employee invite without changing the department manager', async () => {
  const updatedDepartmentIds: string[] = [];

  const prisma = {
    invite: {
      findUnique: async () => ({
        id: 'invite-employee',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'token-employee',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000 * 60),
        company: { name: 'Empresa X' },
        department: { name: 'Comercial' },
      }),
      update: async () => undefined,
    },
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === 'colaborador@empresa.com') {
          return null;
        }

        if (where.id === 'user-employee') {
          return {
            id: 'user-employee',
            name: 'Colaborador',
            email: 'colaborador@empresa.com',
            password: 'hashed',
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: 'company-1',
            departmentId: 'department-1',
            company: {
              id: 'company-1',
              name: 'Empresa X',
              businessArea: 'Tecnologia',
            },
          };
        }

        return null;
      },
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        department: {
          findUnique: async () => ({
            id: 'department-1',
            companyId: 'company-1',
            managerId: 'manager-1',
          }),
          update: async ({ where }: { where: { id: string } }) => {
            updatedDepartmentIds.push(where.id);
          },
        },
        user: {
          create: async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'user-employee',
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: data.companyId,
            departmentId: data.departmentId,
          }),
        },
        invite: {
          update: async () => undefined,
        },
      }),
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-employee' } as never,
    { execute: async () => undefined } as never,
  );

  const response = await service.acceptInvite({
    name: 'Colaborador',
    token: 'token-employee',
    password: '12345678',
    confirmPassword: '12345678',
  });

  assert.equal(response.user.role, UserRole.EMPLOYEE);
  assert.equal(response.user.departmentId, 'department-1');
  assert.deepEqual(updatedDepartmentIds, []);
});

void test('AuthService rejects manager invites when the department already has a manager', async () => {
  const prisma = {
    invite: {
      findUnique: async () => ({
        id: 'invite-1',
        email: 'gestor@empresa.com',
        role: UserRole.MANAGER,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'token-123',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000 * 60),
        company: { name: 'Empresa X' },
        department: { name: 'Comercial' },
      }),
    },
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          return null;
        }

        return null;
      },
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        department: {
          findUnique: async () => ({
            id: 'department-1',
            companyId: 'company-1',
            managerId: 'existing-manager',
          }),
        },
        user: {
          create: async () => {
            throw new Error('should not create user');
          },
        },
        invite: {
          update: async () => undefined,
        },
      }),
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-accepted' } as never,
    { execute: async () => undefined } as never,
  );

  await assert.rejects(
    () =>
      service.acceptInvite({
        name: 'Gestor Comercial',
        token: 'token-123',
        password: '12345678',
        confirmPassword: '12345678',
      }),
    ConflictException,
  );
});

void test('AuthService rejects invites when department data is inconsistent with invite company', async () => {
  const prisma = {
    invite: {
      findUnique: async () => ({
        id: 'invite-1',
        email: 'gestor@empresa.com',
        role: UserRole.MANAGER,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'token-123',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000 * 60),
        company: { name: 'Empresa X' },
        department: { name: 'Comercial' },
      }),
    },
    user: {
      findUnique: async () => null,
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        department: {
          findUnique: async () => ({
            id: 'department-1',
            companyId: 'company-2',
            managerId: null,
          }),
        },
        user: {
          create: async () => {
            throw new Error('should not create user');
          },
        },
        invite: {
          update: async () => undefined,
        },
      }),
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-accepted' } as never,
    { execute: async () => undefined } as never,
  );

  await assert.rejects(
    () =>
      service.acceptInvite({
        name: 'Gestor Comercial',
        token: 'token-123',
        password: '12345678',
        confirmPassword: '12345678',
      }),
    BadRequestException,
  );
});

void test('AuthService rejects expired invites, audits the event and removes the token', async () => {
  const deletedInviteIds: string[] = [];
  const auditCommands: Array<Record<string, unknown>> = [];

  const prisma = {
    invite: {
      findUnique: async () => ({
        id: 'invite-expired',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'expired-token',
        accepted: false,
        expiresAt: new Date(Date.now() - 1000),
        company: { name: 'Empresa X' },
        department: { name: 'Operações' },
      }),
      delete: async ({ where }: { where: { id: string } }) => {
        deletedInviteIds.push(where.id);
      },
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    {
      execute: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    } as never,
  );

  await assert.rejects(
    () => service.getInviteDetails('expired-token'),
    BadRequestException,
  );

  assert.deepEqual(deletedInviteIds, ['invite-expired']);
  assert.equal(auditCommands.length, 1);
  assert.equal(auditCommands[0]?.action, 'invite.expired.rejected');
});
