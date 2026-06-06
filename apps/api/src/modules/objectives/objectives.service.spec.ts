import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { ObjectivesController } from './objectives.controller';
import { ObjectivesService } from './objectives.service';

function createService(prisma: Record<string, unknown>) {
  return new ObjectivesService(prisma as never, new DashboardDomainService(), {
    log: async () => undefined,
  } as never);
}

function buildCycleOption(id: string, name: string, status: 'ACTIVE' | 'CLOSED' = 'ACTIVE') {
  return {
    id,
    name,
    status,
    endDate: new Date('2026-07-01T00:00:00Z'),
  };
}

void test('ObjectivesService lists company objectives only for the director company', async () => {
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
    },
    department: {
      findMany: async () => [{ id: 'department-1', name: 'Marketing' }],
    },
    strategicCycle: {
      findMany: async () => [buildCycleOption('cycle-1', 'Ciclo 1')],
    },
    objective: {
      findMany: async () => [
        {
          id: 'objective-1',
          name: 'Expandir pipeline',
          description: 'Gerar mais demanda',
          cycleId: 'cycle-1',
          cycle: {
            id: 'cycle-1',
            name: 'Ciclo 1',
            status: 'ACTIVE',
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-07-01T00:00:00Z'),
            departmentId: 'department-1',
            department: {
              id: 'department-1',
              name: 'Marketing',
              manager: { id: 'manager-1', name: 'Gestora' },
            },
          },
          okrs: [
            {
              id: 'okr-1',
              currentValue: 70,
              targetValue: 100,
              responsible: { id: 'employee-1', name: 'Pessoa A' },
            },
          ],
        },
      ],
    },
  });

  const response = await service.list(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    {},
  );

  assert.equal(response.scope, 'COMPANY');
  assert.equal(response.objectives.length, 1);
  assert.equal(response.objectives[0]?.departmentName, 'Marketing');
});

void test('ObjectivesService restricts managers to their own department', async () => {
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
      findFirst: async () => ({ id: 'department-1', name: 'Marketing' }),
    },
    strategicCycle: {
      findMany: async () => [buildCycleOption('cycle-1', 'Ciclo 1')],
    },
    objective: {
      findMany: async ({ where }: { where: unknown }) => {
        receivedWhere = where;
        return [
          {
            id: 'objective-1',
            name: 'Expandir pipeline',
            description: 'Gerar mais demanda',
            cycleId: 'cycle-1',
            cycle: {
              id: 'cycle-1',
              name: 'Ciclo 1',
              status: 'ACTIVE',
              startDate: new Date('2026-01-01T00:00:00Z'),
              endDate: new Date('2026-07-01T00:00:00Z'),
              departmentId: 'department-1',
              department: {
                id: 'department-1',
                name: 'Marketing',
                manager: { id: 'manager-1', name: 'Gestora' },
              },
            },
            okrs: [],
          },
        ];
      },
    },
  });

  const response = await service.list(
    { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
    { departmentId: 'department-x' },
  );

  assert.equal(response.scope, 'DEPARTMENT');
  assert.equal(
    response.objectives.every((objective) => objective.departmentId === 'department-1'),
    true,
  );
  assert.deepEqual(receivedWhere, {
    cycle: {
      is: {
        department: { companyId: 'company-1' },
        departmentId: 'department-1',
      },
    },
  });
});

void test('ObjectivesService restricts employees to their own department', async () => {
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
    },
    department: {
      findFirst: async () => ({ id: 'department-2', name: 'Produto' }),
    },
    strategicCycle: {
      findMany: async () => [buildCycleOption('cycle-2', 'Ciclo Produto')],
    },
    objective: {
      findMany: async () => [
        {
          id: 'objective-2',
          name: 'Melhorar onboarding',
          description: 'Refinar o fluxo',
          cycleId: 'cycle-2',
          cycle: {
            id: 'cycle-2',
            name: 'Ciclo Produto',
            status: 'ACTIVE',
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-07-01T00:00:00Z'),
            departmentId: 'department-2',
            department: {
              id: 'department-2',
              name: 'Produto',
              manager: null,
            },
          },
          okrs: [],
        },
      ],
    },
  });

  const response = await service.list(
    { sub: 'employee-1', email: 'colaboradora@empresa.com', role: UserRole.EMPLOYEE },
    {},
  );

  assert.equal(response.scope, 'EMPLOYEE');
  assert.equal(response.objectives.length, 1);
  assert.equal(response.objectives[0]?.departmentName, 'Produto');
});

void test('ObjectivesService blocks creating an objective in a closed cycle', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
    },
    strategicCycle: {
      findFirst: async () => ({
        id: 'cycle-1',
        status: 'CLOSED',
        endDate: new Date('2026-01-01T00:00:00Z'),
        department: {
          id: 'department-1',
          name: 'Marketing',
          manager: null,
        },
      }),
    },
  });

  await assert.rejects(
    () =>
      service.create(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        {
          name: 'Novo objetivo',
          description: 'Descricao',
          cycleId: 'cycle-1',
        },
      ),
    ForbiddenException,
  );
});

void test('ObjectivesService allows listing objectives from a closed cycle', async () => {
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
    },
    department: {
      findMany: async () => [],
    },
    strategicCycle: {
      findMany: async () => [buildCycleOption('cycle-closed', 'Ciclo fechado', 'CLOSED')],
    },
    objective: {
      findMany: async () => [
        {
          id: 'objective-closed',
          name: 'Objetivo legado',
          description: 'Somente leitura',
          cycleId: 'cycle-closed',
          cycle: {
            id: 'cycle-closed',
            name: 'Ciclo fechado',
            status: 'CLOSED',
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-02-01T00:00:00Z'),
            departmentId: 'department-1',
            department: {
              id: 'department-1',
              name: 'Marketing',
              manager: null,
            },
          },
          okrs: [],
        },
      ],
    },
  });

  const response = await service.list(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    {},
  );

  assert.equal(response.objectives.length, 1);
  assert.equal(response.objectives[0]?.cycleStatus, 'CLOSED');
});

void test('ObjectivesService blocks updating an objective from a closed cycle', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
    },
    objective: {
      findFirst: async () => ({
        id: 'objective-1',
        name: 'Objetivo fechado',
        description: 'Descricao',
        cycleId: 'cycle-closed',
        cycle: {
          id: 'cycle-closed',
          name: 'Ciclo fechado',
          status: 'CLOSED',
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-02-01T00:00:00Z'),
          departmentId: 'department-1',
          department: {
            id: 'department-1',
            name: 'Marketing',
            manager: null,
          },
        },
        okrs: [],
      }),
    },
  });

  await assert.rejects(
    () =>
      service.update(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'objective-1',
        { name: 'Novo nome' },
      ),
    ForbiddenException,
  );
});

void test('ObjectivesService blocks moving an objective to a closed cycle', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
    },
    objective: {
      findFirst: async () => ({
        id: 'objective-1',
        name: 'Objetivo ativo',
        description: 'Descricao',
        cycleId: 'cycle-active',
        cycle: {
          id: 'cycle-active',
          name: 'Ciclo ativo',
          status: 'ACTIVE',
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-07-01T00:00:00Z'),
          departmentId: 'department-1',
          department: {
            id: 'department-1',
            name: 'Marketing',
            manager: null,
          },
        },
        okrs: [],
      }),
    },
    strategicCycle: {
      findFirst: async () => ({
        id: 'cycle-closed',
        status: 'CLOSED',
        endDate: new Date('2026-02-01T00:00:00Z'),
        department: {
          id: 'department-1',
          name: 'Marketing',
          manager: null,
        },
      }),
    },
  });

  await assert.rejects(
    () =>
      service.update(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'objective-1',
        { cycleId: 'cycle-closed' },
      ),
    ForbiddenException,
  );
});

void test('ObjectivesService blocks deleting an objective from a closed cycle', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.DIRECTOR,
      }),
    },
    objective: {
      findFirst: async () => ({
        id: 'objective-1',
        name: 'Objetivo fechado',
        description: 'Descricao',
        cycleId: 'cycle-closed',
        cycle: {
          id: 'cycle-closed',
          name: 'Ciclo fechado',
          status: 'CLOSED',
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-02-01T00:00:00Z'),
          departmentId: 'department-1',
          department: {
            id: 'department-1',
            name: 'Marketing',
            manager: null,
          },
        },
        okrs: [],
      }),
    },
  });

  await assert.rejects(
    () =>
      service.remove(
        { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
        'objective-1',
      ),
    ForbiddenException,
  );
});

void test('ObjectivesController protects mutations from employees', () => {
  const createRoles = Reflect.getMetadata(
    ROLES_KEY,
    ObjectivesController.prototype.create,
  ) as UserRole[];
  const updateRoles = Reflect.getMetadata(
    ROLES_KEY,
    ObjectivesController.prototype.update,
  ) as UserRole[];
  const removeRoles = Reflect.getMetadata(
    ROLES_KEY,
    ObjectivesController.prototype.remove,
  ) as UserRole[];

  assert.deepEqual(createRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
  assert.deepEqual(updateRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
  assert.deepEqual(removeRoles, [UserRole.DIRECTOR]);
});
