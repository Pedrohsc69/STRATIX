import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OKRMetricType, UserRole, UserStatus } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { OkrsController } from './okrs.controller';
import { OkrsService } from './okrs.service';

function createService(
  prisma: Record<string, unknown>,
  auditService: Record<string, unknown> = { log: async () => undefined },
) {
  return new OkrsService(prisma as never, new DashboardDomainService(), auditService as never);
}

function buildCycleOption(id: string, name: string, status: 'ACTIVE' | 'CLOSED' = 'ACTIVE') {
  return {
    id,
    name,
    status,
    endDate: new Date('2026-08-01T00:00:00Z'),
  };
}

function buildObjectiveOption(
  id: string,
  name: string,
  cycleId: string,
  status: 'ACTIVE' | 'CLOSED' = 'ACTIVE',
) {
  return {
    id,
    name,
    description: `${name} description`,
    priority: 'UNSPECIFIED',
    cycleId,
    updatedAt: new Date('2026-06-01T00:00:00Z'),
    okrs: [],
    cycle: {
      id: cycleId,
      name: `Ciclo ${cycleId}`,
      status,
      endDate: new Date('2026-08-01T00:00:00Z'),
      departmentId: 'department-1',
      department: {
        id: 'department-1',
        name: 'Marketing',
      },
    },
  };
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
      findMany: async () => [buildCycleOption('cycle-1', 'Ciclo 1')],
    },
    objective: {
      findMany: async () => [buildObjectiveOption('objective-1', 'Aumentar receita', 'cycle-1')],
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
  assert.equal(response.filters.objectives[0]?.description, 'Aumentar receita description');
  assert.equal(response.filters.objectives[0]?.departmentName, 'Marketing');
  assert.equal(response.filters.objectives[0]?.cycleName, 'Ciclo cycle-1');
  assert.equal(response.filters.objectives[0]?.priority, 'UNSPECIFIED');
  assert.equal(response.filters.objectives[0]?.status, 'AT_RISK');
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
      findMany: async () => [buildCycleOption('cycle-1', 'Ciclo 1')],
    },
    objective: {
      findMany: async () => [buildObjectiveOption('objective-1', 'Aumentar receita', 'cycle-1')],
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
      findMany: async () => [buildCycleOption('cycle-2', 'Ciclo Produto')],
    },
    objective: {
      findMany: async () => [buildObjectiveOption('objective-2', 'Melhorar onboarding', 'cycle-2')],
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

void test('OkrsService allows listing OKRs from a closed cycle', async () => {
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
      findMany: async () => [],
    },
    strategicCycle: {
      findMany: async () => [buildCycleOption('cycle-closed', 'Ciclo fechado', 'CLOSED')],
    },
    objective: {
      findMany: async () => [
        buildObjectiveOption('objective-closed', 'Receita histórica', 'cycle-closed', 'CLOSED'),
      ],
    },
    oKR: {
      findMany: async () => [
        {
          id: 'okr-closed',
          name: 'MRR histórico',
          objectiveId: 'objective-closed',
          currentValue: 80,
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
            id: 'objective-closed',
            name: 'Receita histórica',
            cycleId: 'cycle-closed',
            cycle: {
              id: 'cycle-closed',
              name: 'Ciclo fechado',
              status: 'CLOSED',
              startDate: new Date('2026-01-01T00:00:00Z'),
              endDate: new Date('2026-02-01T00:00:00Z'),
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

  assert.equal(response.okrs.length, 1);
  assert.equal(response.okrs[0]?.cycleStatus, 'CLOSED');
});

void test('OkrsService blocks creating an OKR in a closed cycle', async () => {
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
        cycle: {
          id: 'cycle-closed',
          status: 'CLOSED',
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-02-01T00:00:00Z'),
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
          name: 'Novo OKR',
          objectiveId: 'objective-1',
          responsibleId: 'employee-1',
          metricType: OKRMetricType.NUMBER,
          targetValue: 100,
        },
      ),
    ForbiddenException,
  );
});

void test('OkrsService blocks updating an OKR from a closed cycle', async () => {
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
      service.update(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'okr-1',
        { name: 'Novo nome' },
      ),
    ForbiddenException,
  );
});

void test('OkrsService blocks moving an OKR to an objective in a closed cycle', async () => {
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
          cycleId: 'cycle-active',
          cycle: {
            id: 'cycle-active',
            name: 'Ciclo ativo',
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
    objective: {
      findFirst: async () => ({
        id: 'objective-closed',
        cycle: {
          id: 'cycle-closed',
          status: 'CLOSED',
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-02-01T00:00:00Z'),
          departmentId: 'department-1',
        },
      }),
    },
  });

  await assert.rejects(
    () =>
      service.update(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'okr-1',
        { objectiveId: 'objective-closed' },
      ),
    ForbiddenException,
  );
});

void test('OkrsService blocks removing an OKR from a closed cycle', async () => {
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
      service.remove(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'okr-1',
      ),
    ForbiddenException,
  );
});

void test('OkrsService blocks changing the responsible when the cycle is closed', async () => {
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
      service.update(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'okr-1',
        { responsibleId: 'employee-2' },
      ),
    ForbiddenException,
  );
});

void test('OkrsService creates a ProgressOKR record when progress is updated', async () => {
  let createdProgressOkrId: string | undefined;
  let createdProgressActorId: string | undefined;
  let createdProgressValue: number | undefined;
  let createdProgressId: string | undefined;
  const auditCommands: Array<Record<string, unknown>> = [];
  const tx = {
    progressOKR: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdProgressOkrId = data.okrId as string | undefined;
        createdProgressActorId = data.actorId as string | undefined;
        createdProgressValue = data.value as number | undefined;
        createdProgressId = 'progress-1';
        return {
          id: 'progress-1',
        };
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
            createdAt: new Date('2026-05-10T00:00:00Z'),
            actorId: 'manager-1',
            actor: {
              id: 'manager-1',
              name: 'Gestora',
              email: 'gestora@empresa.com',
              role: UserRole.MANAGER,
            },
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

  const updated = await service.addProgress(
    { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
    'okr-1',
    { value: 30.129, comment: 'Atualizacao' },
  );

  assert.equal(createdProgressOkrId, 'okr-1');
  assert.equal(createdProgressActorId, 'manager-1');
  assert.equal(createdProgressValue, 30.13);
  assert.equal(updated.currentValue, 30.13);
  assert.equal(auditCommands[0]?.action, 'OKR_PROGRESS_UPDATED');
  assert.equal(auditCommands[0]?.entity, 'PROGRESS_OKR');
  assert.equal(auditCommands[0]?.entityId, createdProgressId);
  assert.deepEqual(auditCommands[0]?.metadata, {
    okrId: 'okr-1',
    metricType: OKRMetricType.CURRENCY,
  });
  assert.deepEqual(auditCommands[0]?.newValue, {
    currentValue: 30.13,
    progressId: 'progress-1',
  });
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

void test('OkrsService rejects direct currentValue updates outside the progress endpoint', async () => {
  const service = createService({});

  await assert.rejects(
    () =>
      service.update(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'okr-1',
        {
          currentValue: 42,
        } as never,
      ),
    /O progresso do OKR deve ser atualizado pelo endpoint de progresso\./,
  );
});

void test('OkrsService update does not alter currentValue directly', async () => {
  let updatedData: Record<string, unknown> | undefined;
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
    oKR: {
      findFirst: async () => ({
        id: 'okr-1',
        name: 'Receita trimestral',
        metricType: OKRMetricType.NUMBER,
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
      update: async ({ data }: { data: Record<string, unknown> }) => {
        updatedData = data;
        return {
          id: 'okr-1',
          name: 'Receita ajustada',
          metricType: OKRMetricType.NUMBER,
          objectiveId: 'objective-1',
          currentValue: 20,
          targetValue: 120,
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
    auditService: {
      log: async () => undefined,
    },
  });

  await service.update(
    { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
    'okr-1',
    { name: 'Receita ajustada', targetValue: 120 },
  );

  assert.equal(updatedData?.currentValue, undefined);
  assert.equal(updatedData?.targetValue, 120);
});

void test('OkrsService returns paginated progress history ordered by date desc', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: null,
        role: UserRole.DIRECTOR,
      }),
    },
    oKR: {
      findFirst: async () => ({
        id: 'okr-1',
      }),
    },
    progressOKR: {
      findMany: async ({
        orderBy,
        skip,
        take,
      }: {
        orderBy: unknown;
        skip: number;
        take: number;
      }) => {
        assert.deepEqual(orderBy, [{ date: 'desc' }, { createdAt: 'desc' }]);
        assert.equal(skip, 0);
        assert.equal(take, 2);
        return [
          {
            id: 'progress-2',
            value: 45,
            comment: 'Segunda atualização',
            date: new Date('2026-05-11T00:00:00Z'),
            createdAt: new Date('2026-05-11T00:00:00Z'),
            actorId: 'director-1',
            actor: {
              id: 'director-1',
              name: 'Diretora',
              email: 'diretora@empresa.com',
              role: UserRole.DIRECTOR,
            },
          },
          {
            id: 'progress-1',
            value: 30,
            comment: 'Primeira atualização',
            date: new Date('2026-05-10T00:00:00Z'),
            createdAt: new Date('2026-05-10T00:00:00Z'),
            actorId: null,
            actor: null,
          },
        ];
      },
      count: async () => 3,
    },
  });

  const response = await service.progressHistory(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    'okr-1',
    { page: 1, limit: 2 },
  );

  assert.equal(response.items.length, 2);
  assert.equal(response.items[0]?.id, 'progress-2');
  assert.equal(response.items[0]?.actorName, 'Diretora');
  assert.equal(response.items[0]?.actorEmail, 'diretora@empresa.com');
  assert.equal(response.items[0]?.actorRole, UserRole.DIRECTOR);
  assert.equal(response.page, 1);
  assert.equal(response.limit, 2);
  assert.equal(response.total, 3);
  assert.equal(response.totalPages, 2);
  assert.equal(response.items[1]?.actorId, null);
  assert.equal(response.items[1]?.actorName, null);
});

void test('OkrsService progress history is readable for closed cycles', async () => {
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
        id: 'okr-closed',
      }),
    },
    progressOKR: {
      findMany: async () => [
        {
          id: 'progress-1',
          value: 100,
          comment: 'Fechamento',
          date: new Date('2026-02-01T00:00:00Z'),
          createdAt: new Date('2026-02-01T00:00:00Z'),
          actorId: null,
          actor: null,
        },
      ],
      count: async () => 1,
    },
  });

  const response = await service.progressHistory(
    { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
    'okr-closed',
    {},
  );

  assert.equal(response.items.length, 1);
  assert.equal(response.items[0]?.id, 'progress-1');
  assert.equal(response.items[0]?.actorName, null);
});

void test('OkrsService blocks managers from reading progress history outside their department', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-1',
        role: UserRole.MANAGER,
      }),
    },
    oKR: {
      findFirst: async () => null,
    },
  });

  await assert.rejects(
    () =>
      service.progressHistory(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'okr-foreign',
        {},
      ),
    /OKR not found/,
  );
});

void test('OkrsService blocks directors from reading progress history outside their company', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: null,
        role: UserRole.DIRECTOR,
      }),
    },
    oKR: {
      findFirst: async () => null,
    },
  });

  await assert.rejects(
    () =>
      service.progressHistory(
        { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
        'okr-foreign',
        {},
      ),
    /OKR not found/,
  );
});

void test('OkrsService blocks employees from reading progress history outside allowed scope', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        companyId: 'company-1',
        departmentId: 'department-2',
        role: UserRole.EMPLOYEE,
      }),
    },
    oKR: {
      findFirst: async () => null,
    },
  });

  await assert.rejects(
    () =>
      service.progressHistory(
        { sub: 'employee-1', email: 'colaboradora@empresa.com', role: UserRole.EMPLOYEE },
        'okr-foreign',
        {},
      ),
    /OKR not found/,
  );
});

void test('OkrsController protects structure mutations from employees', () => {
  const createRoles = Reflect.getMetadata(ROLES_KEY, OkrsController.prototype.create) as UserRole[];
  const updateRoles = Reflect.getMetadata(ROLES_KEY, OkrsController.prototype.update) as UserRole[];
  const deleteRoles = Reflect.getMetadata(ROLES_KEY, OkrsController.prototype.remove) as UserRole[];
  const progressRoles = Reflect.getMetadata(
    ROLES_KEY,
    OkrsController.prototype.addProgress,
  ) as UserRole[];

  assert.deepEqual(createRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
  assert.deepEqual(updateRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
  assert.deepEqual(deleteRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(progressRoles, [UserRole.DIRECTOR, UserRole.MANAGER, UserRole.EMPLOYEE]);
});
