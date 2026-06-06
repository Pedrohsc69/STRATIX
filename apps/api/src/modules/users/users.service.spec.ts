import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

function createService(prisma: Record<string, unknown>) {
  return new UsersService(
    prisma as never,
    new DashboardDomainService(),
    { log: async () => undefined } as never,
  );
}

void test('UsersService lists only users from the director company and pending invites from that company', async () => {
  let receivedUserWhere: unknown;
  let receivedInviteWhere: unknown;

  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'director-1',
        name: 'Diretora',
        email: 'diretora@empresa.com',
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        companyId: 'company-1',
        departmentId: null,
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: null,
      }),
      findMany: async ({ where }: { where: unknown }) => {
        receivedUserWhere = where;
        return [
          {
            id: 'user-1',
            name: 'Ana',
            email: 'ana@empresa.com',
            role: UserRole.MANAGER,
            status: UserStatus.ACTIVE,
            createdAt: new Date('2026-05-01T10:00:00.000Z'),
            department: { id: 'department-1', name: 'Marketing' },
          },
        ];
      },
    },
    invite: {
      findMany: async ({ where }: { where: unknown }) => {
        receivedInviteWhere = where;
        return [
          {
            id: 'invite-1',
            email: 'novo@empresa.com',
            role: UserRole.EMPLOYEE,
            expiresAt: new Date(Date.now() + 1000 * 60),
            createdAt: new Date('2026-05-02T10:00:00.000Z'),
            department: { id: 'department-1', name: 'Marketing' },
          },
        ];
      },
    },
    department: {
      findMany: async () => [{ id: 'department-1', name: 'Marketing' }],
    },
  });

  const response = await service.list(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    {},
  );

  assert.deepEqual(receivedUserWhere, { companyId: 'company-1' });
  assert.match(JSON.stringify(receivedInviteWhere), /company-1/);
  assert.equal(response.employees.length, 2);
  assert.equal(response.kpis.pendingInvites, 1);
  assert.equal(response.employees[1]?.kind, 'INVITE');
});

void test('UsersService restricts managers to users from their own department', async () => {
  let receivedWhere: unknown;

  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'manager-1',
        name: 'Gestora',
        email: 'gestora@empresa.com',
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        companyId: 'company-1',
        departmentId: 'department-1',
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: { id: 'department-1', name: 'Marketing' },
      }),
      findMany: async ({ where }: { where: unknown }) => {
        receivedWhere = where;
        return [
          {
            id: 'manager-1',
            name: 'Gestora',
            email: 'gestora@empresa.com',
            role: UserRole.MANAGER,
            status: UserStatus.ACTIVE,
            createdAt: new Date('2026-05-01T10:00:00.000Z'),
            department: { id: 'department-1', name: 'Marketing' },
          },
          {
            id: 'employee-1',
            name: 'Pessoa',
            email: 'pessoa@empresa.com',
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE,
            createdAt: new Date('2026-05-03T10:00:00.000Z'),
            department: { id: 'department-1', name: 'Marketing' },
          },
        ];
      },
    },
    oKR: {
      count: async () => 7,
    },
    department: {
      findMany: async () => [{ id: 'department-1', name: 'Marketing' }],
    },
  });

  const response = await service.list(
    { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
    { departmentId: 'department-x' },
  );

  assert.deepEqual(receivedWhere, {
    companyId: 'company-1',
    departmentId: 'department-1',
  });
  assert.equal(response.kpis.totalDepartmentOkrs, 7);
  assert.equal(response.employees.length, 2);
});

void test('UsersService marks expired invites correctly for directors', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'director-1',
        name: 'Diretora',
        email: 'diretora@empresa.com',
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        companyId: 'company-1',
        departmentId: null,
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: null,
      }),
      findMany: async () => [],
    },
    invite: {
      findMany: async () => [
        {
          id: 'invite-expired',
          email: 'expirado@empresa.com',
          role: UserRole.EMPLOYEE,
          expiresAt: new Date(Date.now() - 1000),
          createdAt: new Date('2026-05-02T10:00:00.000Z'),
          department: { id: 'department-1', name: 'Marketing' },
        },
      ],
    },
    department: {
      findMany: async () => [{ id: 'department-1', name: 'Marketing' }],
    },
  });

  const response = await service.list(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    {},
  );

  assert.equal(response.employees[0]?.status, 'EXPIRED');
  assert.equal(response.kpis.pendingInvites, 0);
});

void test('UsersService returns the authenticated profile without sensitive data', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'director-1',
        name: 'Diretora',
        email: 'diretora@empresa.com',
        avatarUrl: 'https://cdn.stratix.test/avatar.png',
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        lastAccessAt: new Date('2026-06-01T10:00:00.000Z'),
        companyId: 'company-1',
        departmentId: null,
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: null,
      }),
      count: async () => 12,
    },
    department: {
      count: async () => 4,
      findFirst: async () => null,
    },
    strategicCycle: {
      count: async () => 9,
    },
  });

  const response = await service.getMe({
    sub: 'director-1',
    email: 'diretora@empresa.com',
    role: UserRole.DIRECTOR,
  });

  assert.equal(response.profile.email, 'diretora@empresa.com');
  assert.equal('password' in response.profile, false);
  assert.equal(response.profile.avatarUrl, 'https://cdn.stratix.test/avatar.png');
  assert.equal(response.stats.totalDepartments, 4);
  assert.equal(response.stats.totalEmployees, 12);
  assert.equal(response.stats.totalCycles, 9);
  assert.equal(response.security.canChangePassword, true);
  assert.equal(response.security.lastAccessAt, '2026-06-01T10:00:00.000Z');
});

void test('UsersService returns department stats for managers only within their department', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'manager-1',
        name: 'Gestora',
        email: 'gestora@empresa.com',
        avatarUrl: null,
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        lastAccessAt: null,
        companyId: 'company-1',
        departmentId: 'department-1',
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: { id: 'department-1', name: 'Marketing' },
      }),
      count: async () => 6,
    },
    department: {
      findFirst: async () => ({
        manager: {
          id: 'manager-1',
          name: 'Gestora',
          email: 'gestora@empresa.com',
        },
      }),
    },
    strategicCycle: {
      count: async () => 3,
    },
    oKR: {
      count: async () => 8,
    },
  });

  const response = await service.getMe({
    sub: 'manager-1',
    email: 'gestora@empresa.com',
    role: UserRole.MANAGER,
  });

  assert.equal(response.profile.manager?.id, 'manager-1');
  assert.equal(response.stats.totalDepartmentCollaborators, 6);
  assert.equal(response.stats.totalDepartmentCycles, 3);
  assert.equal(response.stats.totalDepartmentOkrs, 8);
  assert.equal(response.stats.totalEmployees, 0);
});

void test('UsersService returns employee own OKR stats only', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'employee-1',
        name: 'Colaboradora',
        email: 'colaboradora@empresa.com',
        avatarUrl: null,
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        lastAccessAt: null,
        companyId: 'company-1',
        departmentId: 'department-1',
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: { id: 'department-1', name: 'Marketing' },
      }),
    },
    department: {
      findFirst: async () => ({
        manager: {
          id: 'manager-1',
          name: 'Gestora',
          email: 'gestora@empresa.com',
        },
      }),
    },
    oKR: {
      findMany: async () => [
        { currentValue: 50, targetValue: 100 },
        { currentValue: 100, targetValue: 100 },
      ],
    },
  });

  const response = await service.getMe({
    sub: 'employee-1',
    email: 'colaboradora@empresa.com',
    role: UserRole.EMPLOYEE,
  });

  assert.equal(response.profile.manager?.email, 'gestora@empresa.com');
  assert.equal(response.stats.ownOkrs, 2);
  assert.equal(response.stats.completedOwnOkrs, 1);
  assert.equal(response.stats.averageOwnProgress, 75);
  assert.equal(response.stats.totalDepartmentOkrs, 0);
});

void test('UsersService updates only the authenticated user avatar', async () => {
  let updatedAvatarUrl = '';
  const service = createService({
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id === 'user-1') {
          return {
            id: 'user-1',
            name: 'Diretora',
            email: 'diretora@empresa.com',
            avatarUrl: null,
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            lastAccessAt: new Date('2026-06-01T10:00:00.000Z'),
            companyId: 'company-1',
            departmentId: null,
            company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
            department: null,
          };
        }

        return null;
      },
      update: async ({ data }: { data: { avatarUrl: string | null } }) => {
        updatedAvatarUrl = data.avatarUrl ?? '';
      },
      count: async () => 10,
    },
    department: {
      count: async () => 3,
      findFirst: async () => null,
    },
    strategicCycle: {
      count: async () => 4,
    },
  });

  const response = await service.updateMyAvatar(
    { sub: 'user-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    { avatarUrl: 'https://cdn.stratix.test/new-avatar.png' },
  );

  assert.equal(updatedAvatarUrl, 'https://cdn.stratix.test/new-avatar.png');
  assert.equal(response.profile.email, 'diretora@empresa.com');
});

void test('UsersService blocks employees from listing employees', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'employee-1',
        name: 'Colaboradora',
        email: 'colaboradora@empresa.com',
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        companyId: 'company-1',
        departmentId: 'department-1',
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: { id: 'department-1', name: 'Marketing' },
      }),
    },
  });

  await assert.rejects(
    () =>
      service.list(
        { sub: 'employee-1', email: 'colaboradora@empresa.com', role: UserRole.EMPLOYEE },
        {},
      ),
    ForbiddenException,
  );
});

void test('UsersService blocks manager access to user from another department', async () => {
  let receivedWhere: unknown;

  const service = createService({
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id === 'manager-1') {
          return {
            id: 'manager-1',
            name: 'Gestora',
            email: 'gestora@empresa.com',
            role: UserRole.MANAGER,
            status: UserStatus.ACTIVE,
            companyId: 'company-1',
            departmentId: 'department-1',
            company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
            department: { id: 'department-1', name: 'Marketing' },
          };
        }

        return null;
      },
      findFirst: async ({ where }: { where: unknown }) => {
        receivedWhere = where;
        return null;
      },
    },
  });

  await assert.rejects(
    () =>
      service.getById(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'user-2',
      ),
    NotFoundException,
  );

  assert.deepEqual(receivedWhere, {
    id: 'user-2',
    companyId: 'company-1',
    departmentId: 'department-1',
  });
});

void test('UsersController protects list and details for directors and managers only', () => {
  const meRoles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.getMe) as
    | UserRole[]
    | undefined;
  const listRoles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.list) as UserRole[];
  const getRoles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.getById) as UserRole[];

  assert.equal(meRoles, undefined);
  assert.deepEqual(listRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
  assert.deepEqual(getRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
});
