import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

function createService(
  prisma: Record<string, unknown>,
  auditService: Record<string, unknown> = { log: async () => undefined },
) {
  return new DepartmentsService(
    prisma as never,
    new DashboardDomainService(),
    auditService as never,
  );
}

void test('DepartmentsService lists only departments from the director company', async () => {
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
      findMany: async () => [{ id: 'manager-1', name: 'Ana', email: 'ana@empresa.com' }],
    },
    department: {
      findMany: async () => [
        {
          id: 'department-1',
          name: 'Marketing',
          managerId: 'manager-1',
          manager: { id: 'manager-1', name: 'Ana', email: 'ana@empresa.com' },
          users: [
            {
              id: 'user-1',
              name: 'Pessoa A',
              email: 'pessoa@empresa.com',
              role: UserRole.MANAGER,
              status: UserStatus.ACTIVE,
            },
          ],
          cycles: [],
        },
        {
          id: 'department-2',
          name: 'Produto',
          managerId: null,
          manager: null,
          users: [],
          cycles: [],
        },
      ],
    },
  });

  const response = await service.list(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    {},
  );

  assert.equal(response.scope, 'COMPANY');
  assert.equal(response.departments.length, 2);
  assert.equal(response.kpis.totalDepartments, 2);
  assert.equal(response.filters.managers.length, 1);
  assert.equal(response.departments[0]?.manager?.name, 'Ana');
});

void test('DepartmentsService restricts managers to their own department', async () => {
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
      findMany: async () => [
        { id: 'manager-1', name: 'Gestora', email: 'gestora@empresa.com' },
      ],
    },
    department: {
      findMany: async ({ where }: { where: unknown }) => {
        receivedWhere = where;
        return [
          {
            id: 'department-1',
            name: 'Marketing',
            managerId: 'manager-1',
            manager: {
              id: 'manager-1',
              name: 'Gestora',
              email: 'gestora@empresa.com',
            },
            users: [],
            cycles: [],
          },
        ];
      },
    },
  });

  const response = await service.list(
    { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
    { managerId: 'manager-x' },
  );

  assert.equal(response.scope, 'DEPARTMENT');
  assert.equal(response.departments.length, 1);
  assert.deepEqual(receivedWhere, {
    companyId: 'company-1',
    id: 'department-1',
  });
});

void test('DepartmentsService restricts employees to their own department', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'employee-1',
        name: 'Colaboradora',
        email: 'colaboradora@empresa.com',
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        companyId: 'company-1',
        departmentId: 'department-2',
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: { id: 'department-2', name: 'Produto' },
      }),
      findMany: async () => [],
    },
    department: {
      findMany: async () => [
        {
          id: 'department-2',
          name: 'Produto',
          managerId: null,
          manager: null,
          users: [],
          cycles: [],
        },
      ],
    },
  });

  const response = await service.list(
    { sub: 'employee-1', email: 'colaboradora@empresa.com', role: UserRole.EMPLOYEE },
    {},
  );

  assert.equal(response.scope, 'EMPLOYEE');
  assert.equal(response.departments.length, 1);
  assert.equal(
    response.permissions.includes('departments:view:department:readonly'),
    true,
  );
});

void test('DepartmentsService blocks manager access to another department', async () => {
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
    },
    department: {
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
        'department-2',
      ),
    NotFoundException,
  );

  assert.deepEqual(receivedWhere, {
    companyId: 'company-1',
    id: '__no-department__',
  });
});

void test('DepartmentsService blocks employee access to another department', async () => {
  let receivedWhere: unknown;
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
    department: {
      findFirst: async ({ where }: { where: unknown }) => {
        receivedWhere = where;
        return null;
      },
    },
  });

  await assert.rejects(
    () =>
      service.getById(
        { sub: 'employee-1', email: 'colaboradora@empresa.com', role: UserRole.EMPLOYEE },
        'department-2',
      ),
    NotFoundException,
  );

  assert.deepEqual(receivedWhere, {
    companyId: 'company-1',
    id: '__no-department__',
  });
});

void test('DepartmentsService blocks deletion when users are linked', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
      }),
    },
    department: {
      findFirst: async () => ({
        id: 'department-1',
        users: [{ id: 'user-1' }],
        invites: [],
        cycles: [],
      }),
    },
  });

  await assert.rejects(
    () =>
      service.remove(
        { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
        'department-1',
      ),
    BadRequestException,
  );
});

void test('DepartmentsService blocks deletion when strategic cycles are linked', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
      }),
    },
    department: {
      findFirst: async () => ({
        id: 'department-1',
        users: [],
        invites: [],
        cycles: [{ id: 'cycle-1' }],
      }),
    },
  });

  await assert.rejects(
    () =>
      service.remove(
        { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
        'department-1',
      ),
    BadRequestException,
  );
});

void test('DepartmentsService creates an audit log when creating a department', async () => {
  const auditCommands: Array<Record<string, unknown>> = [];
  const service = createService(
    {
      user: {
        findUnique: async () => ({
          companyId: 'company-1',
        }),
      },
      department: {
        findFirst: async () => null,
      },
      $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
        callback({
          department: {
            create: async () => ({
              id: 'department-1',
            }),
            findUnique: async () => ({
              id: 'department-1',
              name: 'Operacoes',
              companyId: 'company-1',
              managerId: null,
              manager: null,
              users: [],
              cycles: [],
            }),
          },
        }),
    },
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    },
  );

  await service.create(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    { name: 'Operacoes' },
  );

  assert.equal(auditCommands[0]?.action, 'DEPARTMENT_CREATED');
});

void test('DepartmentsService creates an audit log when updating a department', async () => {
  const auditCommands: Array<Record<string, unknown>> = [];
  const service = createService(
    {
      user: {
        findUnique: async () => ({
          companyId: 'company-1',
        }),
      },
      department: {
        findFirst: async ({ where }: { where: { id?: string } }) => {
          if (where.id === 'department-1') {
            return {
              id: 'department-1',
              name: 'Operacoes',
              companyId: 'company-1',
              managerId: null,
              manager: null,
              users: [],
              cycles: [],
            };
          }

          return null;
        },
      },
      $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
        callback({
          department: {
            update: async () => undefined,
            findUnique: async () => ({
              id: 'department-1',
              name: 'Operacoes e Logistica',
              companyId: 'company-1',
              managerId: null,
              manager: null,
              users: [],
              cycles: [],
            }),
          },
        }),
    },
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    },
  );

  await service.update(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    'department-1',
    { name: 'Operacoes e Logistica' },
  );

  assert.equal(auditCommands[0]?.action, 'DEPARTMENT_UPDATED');
});

void test('DepartmentsController protects mutations for directors only', () => {
  const createRoles = Reflect.getMetadata(ROLES_KEY, DepartmentsController.prototype.create) as UserRole[];
  const updateRoles = Reflect.getMetadata(ROLES_KEY, DepartmentsController.prototype.update) as UserRole[];
  const removeRoles = Reflect.getMetadata(ROLES_KEY, DepartmentsController.prototype.remove) as UserRole[];

  assert.deepEqual(createRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(updateRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(removeRoles, [UserRole.DIRECTOR]);
});
