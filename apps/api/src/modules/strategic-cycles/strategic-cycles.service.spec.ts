import test from 'node:test';
import assert from 'node:assert/strict';
import { UserRole, UserStatus } from '@prisma/client';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { StrategicCyclesService } from './strategic-cycles.service';

function createService(prisma: Record<string, unknown>) {
  return new StrategicCyclesService(
    prisma as never,
    new DashboardDomainService(),
  );
}

void test('StrategicCyclesService lists company cycles only for the director company', async () => {
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
        company: {
          id: 'company-1',
          name: 'Empresa 1',
          businessArea: 'Tecnologia',
        },
        department: null,
      }),
    },
    department: {
      findMany: async () => [
        { id: 'department-1', name: 'Marketing' },
        { id: 'department-2', name: 'Produto' },
      ],
    },
    strategicCycle: {
      findMany: async () => [
        {
          id: 'cycle-1',
          name: 'Ciclo Marketing',
          status: 'ACTIVE',
          startDate: new Date('2026-01-10T00:00:00Z'),
          endDate: new Date('2026-07-10T00:00:00Z'),
          departmentId: 'department-1',
          department: { id: 'department-1', name: 'Marketing' },
          objectives: [
            {
              id: 'objective-1',
              name: 'Gerar demanda',
              okrs: [
                {
                  id: 'okr-1',
                  name: 'Leads',
                  currentValue: 70,
                  targetValue: 100,
                  responsible: { id: 'employee-1', name: 'Pessoa A' },
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const response = await service.list(
    {
      sub: 'director-1',
      email: 'diretora@empresa.com',
      role: UserRole.DIRECTOR,
    },
    {},
  );

  assert.equal(response.scope, 'COMPANY');
  assert.equal(response.filters.departments.length, 2);
  assert.equal(response.cycles.length, 1);
  assert.equal(response.cycles[0]?.departmentName, 'Marketing');
});

void test('StrategicCyclesService restricts managers to their own department', async () => {
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
        company: {
          id: 'company-1',
          name: 'Empresa 1',
          businessArea: 'Tecnologia',
        },
        department: {
          id: 'department-1',
          name: 'Marketing',
        },
      }),
    },
    department: {
      findFirst: async () => ({ id: 'department-1', name: 'Marketing' }),
    },
    strategicCycle: {
      findMany: async ({ where }: { where: unknown }) => {
        receivedWhere = where;
        return [
          {
            id: 'cycle-1',
            name: 'Ciclo Marketing',
            status: 'ACTIVE',
            startDate: new Date('2026-01-10T00:00:00Z'),
            endDate: new Date('2026-02-10T00:00:00Z'),
            departmentId: 'department-1',
            department: { id: 'department-1', name: 'Marketing' },
            objectives: [],
          },
        ];
      },
    },
  });

  const response = await service.list(
    {
      sub: 'manager-1',
      email: 'gestora@empresa.com',
      role: UserRole.MANAGER,
    },
    {
      departmentId: 'department-999',
    },
  );

  assert.equal(response.scope, 'DEPARTMENT');
  assert.equal(response.context.department?.id, 'department-1');
  assert.equal(response.cycles.every((cycle) => cycle.departmentId === 'department-1'), true);
  assert.deepEqual(receivedWhere, {
    department: { companyId: 'company-1' },
    departmentId: 'department-1',
  });
});

void test('StrategicCyclesService restricts employees to their own department', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'employee-1',
        name: 'Colaboradora',
        email: 'colaboradora@empresa.com',
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        companyId: 'company-1',
        departmentId: 'department-7',
        company: {
          id: 'company-1',
          name: 'Empresa 1',
          businessArea: 'Tecnologia',
        },
        department: {
          id: 'department-7',
          name: 'Produto',
        },
      }),
    },
    department: {
      findFirst: async () => ({ id: 'department-7', name: 'Produto' }),
    },
    strategicCycle: {
      findMany: async () => [
        {
          id: 'cycle-7',
          name: 'Ciclo Produto',
          status: 'CLOSED',
          startDate: new Date('2026-01-10T00:00:00Z'),
          endDate: new Date('2026-02-10T00:00:00Z'),
          departmentId: 'department-7',
          department: { id: 'department-7', name: 'Produto' },
          objectives: [],
        },
      ],
    },
  });

  const response = await service.list(
    {
      sub: 'employee-1',
      email: 'colaboradora@empresa.com',
      role: UserRole.EMPLOYEE,
    },
    {},
  );

  assert.equal(response.scope, 'EMPLOYEE');
  assert.equal(response.cycles.length, 1);
  assert.equal(response.cycles[0]?.departmentName, 'Produto');
  assert.equal(response.permissions.includes('cycles:view:department'), true);
});

void test('StrategicCyclesService computes delayed status without leaking closed cycles into active filter', async () => {
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
        company: {
          id: 'company-1',
          name: 'Empresa 1',
          businessArea: 'Tecnologia',
        },
        department: null,
      }),
    },
    department: {
      findMany: async () => [],
    },
    strategicCycle: {
      findMany: async () => [
        {
          id: 'cycle-1',
          name: 'Ciclo atrasado',
          status: 'ACTIVE',
          startDate: new Date('2025-01-01T00:00:00Z'),
          endDate: new Date('2025-02-01T00:00:00Z'),
          departmentId: 'department-1',
          department: { id: 'department-1', name: 'Marketing' },
          objectives: [],
        },
        {
          id: 'cycle-2',
          name: 'Ciclo fechado',
          status: 'CLOSED',
          startDate: new Date('2025-01-01T00:00:00Z'),
          endDate: new Date('2025-02-01T00:00:00Z'),
          departmentId: 'department-1',
          department: { id: 'department-1', name: 'Marketing' },
          objectives: [],
        },
      ],
    },
  });

  const delayedOnly = await service.list(
    {
      sub: 'director-1',
      email: 'diretora@empresa.com',
      role: UserRole.DIRECTOR,
    },
    { status: 'DELAYED' },
  );

  assert.equal(delayedOnly.cycles.length, 1);
  assert.equal(delayedOnly.cycles[0]?.status, 'DELAYED');
});
