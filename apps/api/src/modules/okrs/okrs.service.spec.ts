import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { OKRMetricType, UserRole, UserStatus } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { OkrsController } from './okrs.controller';
import { OkrsService } from './okrs.service';

function createService(
  prisma: Record<string, unknown>,
  auditService: Record<string, unknown> = { log: async () => undefined },
) {
  return new OkrsService(
    prisma as never,
    new DashboardDomainService(),
    auditService as never,
  );
}

void test('OkrsService lists company OKRs only for the director company', async () => {
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
      findMany: async () => [
        { id: 'manager-1', name: 'Gestora', department: { name: 'Marketing' } },
      ],
    },
    department: {
      findMany: async () => [{ id: 'department-1', name: 'Marketing' }],
    },
    strategicCycle: {
      findMany: async () => [{ id: 'cycle-1', name: 'Ciclo 1' }],
    },
    objective: {
      findMany: async () => [{ id: 'objective-1', name: 'Aumentar receita' }],
    },
    oKR: {
      findMany: async () => [
        {
          id: 'okr-1',
          name: 'Receita trimestral',
          objectiveId: 'objective-1',
          currentValue: 60,
          targetValue: 100,
          responsibleId: 'manager-1',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-05-01T00:00:00Z'),
          responsible: {
            id: 'manager-1',
            name: 'Gestora',
            departmentId: 'department-1',
          },
          objective: {
            id: 'objective-1',
            name: 'Aumentar receita',
            cycleId: 'cycle-1',
            cycle: {
              id: 'cycle-1',
              name: 'Ciclo 1',
              status: 'ACTIVE',
              startDate: new Date('2026-01-01T00:00:00Z'),
              endDate: new Date('2026-08-01T00:00:00Z'),
              departmentId: 'department-1',
              department: { id: 'department-1', name: 'Marketing' },
            },
          },
          progress: [],
        },
      ],
    },
  });

  const response = await service.list(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    {},
  );

  assert.equal(response.scope, 'COMPANY');
  assert.equal(response.okrs.length, 1);
  assert.equal(response.okrs[0]?.departmentName, 'Marketing');
});

void test('OkrsService restricts managers to their own department', async () => {
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
        { id: 'employee-1', name: 'Pessoa A', department: { name: 'Marketing' } },
      ],
    },
    department: {
      findFirst: async () => ({ id: 'department-1', name: 'Marketing' }),
    },
    strategicCycle: {
      findMany: async () => [{ id: 'cycle-1', name: 'Ciclo 1' }],
    },
    objective: {
      findMany: async () => [{ id: 'objective-1', name: 'Aumentar receita' }],
    },
    oKR: {
      findMany: async ({ where }: { where: unknown }) => {
        receivedWhere = where;
        return [];
      },
    },
  });

  await service.list(
    { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
    { departmentId: 'department-x' },
  );

  assert.deepEqual(receivedWhere, {
    deletedAt: null,
    objective: {
      is: {
        cycle: {
          is: {
            department: { companyId: 'company-1' },
            departmentId: 'department-1',
          },
        },
      },
    },
  });
});

void test('OkrsService restricts employees to their own department', async () => {
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
      findMany: async () => [
        { id: 'employee-1', name: 'Colaboradora', department: { name: 'Produto' } },
      ],
    },
    department: {
      findFirst: async () => ({ id: 'department-2', name: 'Produto' }),
    },
    strategicCycle: {
      findMany: async () => [{ id: 'cycle-2', name: 'Ciclo Produto' }],
    },
    objective: {
      findMany: async () => [{ id: 'objective-2', name: 'Melhorar onboarding' }],
    },
    oKR: {
      findMany: async () => [
        {
          id: 'okr-2',
          name: 'Reduzir churn',
          objectiveId: 'objective-2',
          currentValue: 20,
          targetValue: 100,
          responsibleId: 'employee-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          responsible: {
            id: 'employee-1',
            name: 'Colaboradora',
            departmentId: 'department-2',
          },
          objective: {
            id: 'objective-2',
            name: 'Melhorar onboarding',
            cycleId: 'cycle-2',
            cycle: {
              id: 'cycle-2',
              name: 'Ciclo Produto',
              status: 'ACTIVE',
              startDate: new Date('2026-01-01T00:00:00Z'),
              endDate: new Date('2026-08-01T00:00:00Z'),
              departmentId: 'department-2',
              department: { id: 'department-2', name: 'Produto' },
            },
          },
          progress: [],
        },
      ],
    },
  });

  const response = await service.list(
    { sub: 'employee-1', email: 'colaboradora@empresa.com', role: UserRole.EMPLOYEE },
    {},
  );

  assert.equal(response.scope, 'EMPLOYEE');
  assert.equal(response.okrs.length, 1);
  assert.equal(response.okrs[0]?.isOwnedByCurrentUser, true);
});

void test('OkrsService blocks employees from updating progress on OKRs they do not own', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.EMPLOYEE,
      }),
    },
    oKR: {
      findFirst: async () => ({
        id: 'okr-1',
        name: 'Receita trimestral',
        objectiveId: 'objective-1',
        currentValue: 20,
        targetValue: 100,
        responsibleId: 'employee-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        responsible: {
          id: 'employee-2',
          name: 'Pessoa B',
          departmentId: 'department-1',
        },
        objective: {
          id: 'objective-1',
          name: 'Aumentar receita',
          cycleId: 'cycle-1',
          cycle: {
            id: 'cycle-1',
            name: 'Ciclo 1',
            status: 'ACTIVE',
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-08-01T00:00:00Z'),
            departmentId: 'department-1',
            department: { id: 'department-1', name: 'Marketing' },
          },
        },
        progress: [],
      }),
    },
  });

  await assert.rejects(
    () =>
      service.addProgress(
        { sub: 'employee-1', email: 'colaboradora@empresa.com', role: UserRole.EMPLOYEE },
        'okr-1',
        { value: 30, comment: 'Atualizacao' },
      ),
    ForbiddenException,
  );
});

void test('OkrsService blocks assigning a responsible user from another department', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
      findFirst: async () => ({
        id: 'employee-2',
        departmentId: 'department-2',
      }),
    },
    oKR: {
      findFirst: async () => ({
        id: 'okr-1',
        name: 'Receita trimestral',
        objectiveId: 'objective-1',
        currentValue: 20,
        targetValue: 100,
        responsibleId: 'employee-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        responsible: {
          id: 'employee-1',
          name: 'Pessoa A',
          departmentId: 'department-1',
        },
        objective: {
          id: 'objective-1',
          name: 'Aumentar receita',
          cycleId: 'cycle-1',
          cycle: {
            id: 'cycle-1',
            name: 'Ciclo 1',
            status: 'ACTIVE',
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-08-01T00:00:00Z'),
            departmentId: 'department-1',
            department: { id: 'department-1', name: 'Marketing' },
          },
        },
        progress: [],
      }),
    },
  };

  const service = createService(prisma);

  await assert.rejects(
    () =>
      service.update(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'okr-1',
        { responsibleId: 'employee-2' },
      ),
    ForbiddenException,
  );
});

void test('OkrsService blocks progress values above the target', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
    },
    oKR: {
      findFirst: async () => ({
        id: 'okr-1',
        name: 'Receita trimestral',
        objectiveId: 'objective-1',
        currentValue: 20,
        targetValue: 100,
        responsibleId: 'employee-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        responsible: {
          id: 'employee-1',
          name: 'Pessoa A',
          departmentId: 'department-1',
        },
        objective: {
          id: 'objective-1',
          name: 'Aumentar receita',
          cycleId: 'cycle-1',
          cycle: {
            id: 'cycle-1',
            name: 'Ciclo 1',
            status: 'ACTIVE',
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-08-01T00:00:00Z'),
            departmentId: 'department-1',
            department: { id: 'department-1', name: 'Marketing' },
          },
        },
        progress: [],
      }),
    },
  });

  await assert.rejects(
    () =>
      service.addProgress(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'okr-1',
        { value: 120 },
      ),
    BadRequestException,
  );
});

void test('OkrsService blocks updates when the strategic cycle is closed', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
    },
    oKR: {
      findFirst: async () => ({
        id: 'okr-1',
        name: 'Receita trimestral',
        objectiveId: 'objective-1',
        currentValue: 20,
        targetValue: 100,
        responsibleId: 'employee-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        responsible: {
          id: 'employee-1',
          name: 'Pessoa A',
          departmentId: 'department-1',
        },
        objective: {
          id: 'objective-1',
          name: 'Aumentar receita',
          cycleId: 'cycle-1',
          cycle: {
            id: 'cycle-1',
            name: 'Ciclo 1',
            status: 'CLOSED',
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-02-01T00:00:00Z'),
            departmentId: 'department-1',
            department: { id: 'department-1', name: 'Marketing' },
          },
        },
        progress: [],
      }),
    },
  });

  await assert.rejects(
    () =>
      service.addProgress(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'okr-1',
        { value: 30 },
      ),
    ForbiddenException,
  );
});

void test('OkrsService creates a ProgressOKR record when progress is updated', async () => {
  let createdProgressOkrId: string | undefined;
  let createdProgressValue: number | undefined;
  const auditCommands: Array<Record<string, unknown>> = [];
  const tx = {
    progressOKR: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdProgressOkrId = data.okrId as string | undefined;
        createdProgressValue = data.value as number | undefined;
      },
    },
    oKR: {
      update: async () => ({
        id: 'okr-1',
        name: 'Receita trimestral',
        metricType: OKRMetricType.CURRENCY,
        objectiveId: 'objective-1',
        currentValue: 30.13,
        targetValue: 100,
        responsibleId: 'employee-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        responsible: {
          id: 'employee-1',
          name: 'Pessoa A',
          departmentId: 'department-1',
        },
        objective: {
          id: 'objective-1',
          name: 'Aumentar receita',
          cycleId: 'cycle-1',
          cycle: {
            id: 'cycle-1',
            name: 'Ciclo 1',
            status: 'ACTIVE',
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-08-01T00:00:00Z'),
            departmentId: 'department-1',
            department: { id: 'department-1', name: 'Marketing' },
          },
        },
        progress: [
          {
            id: 'progress-1',
            value: 30.13,
            date: new Date('2026-05-10T00:00:00Z'),
            comment: 'Atualizacao',
          },
        ],
      }),
    },
  };

  const service = createService(
    {
      user: {
        findUnique: async () => ({
          companyId: 'company-1',
          departmentId: 'department-1',
          role: UserRole.MANAGER,
        }),
      },
      oKR: {
        findFirst: async () => ({
          id: 'okr-1',
          name: 'Receita trimestral',
          metricType: OKRMetricType.CURRENCY,
          objectiveId: 'objective-1',
          currentValue: 20,
          targetValue: 100,
          responsibleId: 'employee-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          responsible: {
            id: 'employee-1',
            name: 'Pessoa A',
            departmentId: 'department-1',
          },
          objective: {
            id: 'objective-1',
            name: 'Aumentar receita',
            cycleId: 'cycle-1',
            cycle: {
              id: 'cycle-1',
              name: 'Ciclo 1',
              status: 'ACTIVE',
              startDate: new Date('2026-01-01T00:00:00Z'),
              endDate: new Date('2026-08-01T00:00:00Z'),
              departmentId: 'department-1',
              department: { id: 'department-1', name: 'Marketing' },
            },
          },
          progress: [],
        }),
      },
      $transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
    },
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    },
  );

  await service.addProgress(
    { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
    'okr-1',
    { value: 30.129, comment: 'Atualizacao' },
  );

  assert.equal(createdProgressOkrId, 'okr-1');
  assert.equal(createdProgressValue, 30.13);
  assert.equal(auditCommands[0]?.action, 'OKR_PROGRESS_UPDATED');
});

void test('OkrsService normalizes numeric values before creating an OKR', async () => {
  let createdData: Record<string, unknown> | undefined;
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
      findFirst: async () => ({
        id: 'employee-1',
        departmentId: 'department-1',
      }),
    },
    objective: {
      findFirst: async () => ({
        id: 'objective-1',
        cycle: {
          id: 'cycle-1',
          status: 'ACTIVE',
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-08-01T00:00:00Z'),
          departmentId: 'department-1',
        },
      }),
    },
    oKR: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdData = data;
        return {
          id: 'okr-1',
          name: 'Receita trimestral',
          metricType: OKRMetricType.NUMBER,
          objectiveId: 'objective-1',
          currentValue: 3,
          targetValue: 100000,
          responsibleId: 'employee-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          responsible: {
            id: 'employee-1',
            name: 'Pessoa A',
            departmentId: 'department-1',
          },
          objective: {
            id: 'objective-1',
            name: 'Aumentar receita',
            cycleId: 'cycle-1',
            cycle: {
              id: 'cycle-1',
              name: 'Ciclo 1',
              status: 'ACTIVE',
              startDate: new Date('2026-01-01T00:00:00Z'),
              endDate: new Date('2026-08-01T00:00:00Z'),
              departmentId: 'department-1',
              department: { id: 'department-1', name: 'Marketing' },
            },
          },
          progress: [],
        };
      },
    },
  });

  await service.create(
    { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
    {
      name: 'Receita trimestral',
      objectiveId: 'objective-1',
      responsibleId: 'employee-1',
      metricType: OKRMetricType.NUMBER,
      currentValue: 3.000001,
      targetValue: 100000.000001,
    },
  );

  assert.equal(createdData?.currentValue, 3);
  assert.equal(createdData?.targetValue, 100000);
});

void test('OkrsService blocks percentage targets above 100', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
      findFirst: async () => ({
        id: 'employee-1',
        departmentId: 'department-1',
      }),
    },
    objective: {
      findFirst: async () => ({
        id: 'objective-1',
        cycle: {
          id: 'cycle-1',
          status: 'ACTIVE',
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-08-01T00:00:00Z'),
          departmentId: 'department-1',
        },
      }),
    },
  });

  await assert.rejects(
    () =>
      service.create(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        {
          name: 'Conversao',
          objectiveId: 'objective-1',
          responsibleId: 'employee-1',
          metricType: OKRMetricType.PERCENTAGE,
          currentValue: 50,
          targetValue: 120,
        },
      ),
    BadRequestException,
  );
});

void test('OkrsService blocks boolean values outside 0 and 1', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
    },
    oKR: {
      findFirst: async () => ({
        id: 'okr-1',
        name: 'Lancar funcionalidade',
        metricType: OKRMetricType.BOOLEAN,
        objectiveId: 'objective-1',
        currentValue: 0,
        targetValue: 1,
        responsibleId: 'employee-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        responsible: {
          id: 'employee-1',
          name: 'Pessoa A',
          departmentId: 'department-1',
        },
        objective: {
          id: 'objective-1',
          name: 'Entrega',
          cycleId: 'cycle-1',
          cycle: {
            id: 'cycle-1',
            name: 'Ciclo 1',
            status: 'ACTIVE',
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-08-01T00:00:00Z'),
            departmentId: 'department-1',
            department: { id: 'department-1', name: 'Marketing' },
          },
        },
        progress: [],
      }),
    },
  });

  await assert.rejects(
    () =>
      service.addProgress(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'okr-1',
        { value: 0.4 },
      ),
    BadRequestException,
  );
});

void test('OkrsService blocks invalid numeric values', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
      findFirst: async () => ({
        id: 'employee-1',
        departmentId: 'department-1',
      }),
    },
    objective: {
      findFirst: async () => ({
        id: 'objective-1',
        cycle: {
          id: 'cycle-1',
          status: 'ACTIVE',
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-08-01T00:00:00Z'),
          departmentId: 'department-1',
        },
      }),
    },
  });

  await assert.rejects(
    () =>
      service.create(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        {
          name: 'Receita',
          objectiveId: 'objective-1',
          responsibleId: 'employee-1',
          metricType: OKRMetricType.NUMBER,
          currentValue: -1,
          targetValue: 10,
        },
      ),
    BadRequestException,
  );

  await assert.rejects(
    () =>
      service.create(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        {
          name: 'Receita',
          objectiveId: 'objective-1',
          responsibleId: 'employee-1',
          metricType: OKRMetricType.NUMBER,
          currentValue: 0,
          targetValue: Number.POSITIVE_INFINITY,
        },
      ),
    BadRequestException,
  );
});

void test('OkrsController protects structure mutations from employees', () => {
  const createRoles = Reflect.getMetadata(ROLES_KEY, OkrsController.prototype.create) as UserRole[];
  const updateRoles = Reflect.getMetadata(ROLES_KEY, OkrsController.prototype.update) as UserRole[];
  const deleteRoles = Reflect.getMetadata(ROLES_KEY, OkrsController.prototype.remove) as UserRole[];
  const progressRoles = Reflect.getMetadata(ROLES_KEY, OkrsController.prototype.addProgress) as UserRole[];

  assert.deepEqual(createRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
  assert.deepEqual(updateRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
  assert.deepEqual(deleteRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(progressRoles, [UserRole.DIRECTOR, UserRole.MANAGER, UserRole.EMPLOYEE]);
});
