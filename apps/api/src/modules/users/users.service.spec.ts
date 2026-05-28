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
  return new UsersService(prisma as never, new DashboardDomainService());
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
  const listRoles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.list) as UserRole[];
  const getRoles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.getById) as UserRole[];

  assert.deepEqual(listRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
  assert.deepEqual(getRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
});
