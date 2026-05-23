import test from 'node:test';
import assert from 'node:assert/strict';
import { UserRole, UserStatus } from '@prisma/client';
import { DashboardDomainService } from '../../domain/services/dashboard-domain.service';
import { GetDashboardUseCase } from './get-dashboard.usecase';

void test('GetDashboardUseCase builds a company dashboard for directors', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        name: 'Diretora',
        email: 'diretora@empresa.com',
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        isActive: true,
        companyId: 'company-1',
        departmentId: null,
        company: {
          id: 'company-1',
          name: 'Empresa X',
          businessArea: 'Tecnologia',
        },
        department: null,
      }),
      findMany: async () => [
        {
          id: 'director-1',
          name: 'Diretora',
          role: UserRole.DIRECTOR,
          status: UserStatus.ACTIVE,
          updatedAt: new Date('2026-05-20T10:00:00Z'),
          department: null,
        },
        {
          id: 'manager-1',
          name: 'Gestor A',
          role: UserRole.MANAGER,
          status: UserStatus.ACTIVE,
          updatedAt: new Date('2026-05-21T10:00:00Z'),
          department: { id: 'department-1', name: 'Marketing' },
        },
        {
          id: 'employee-1',
          name: 'Colaborador A',
          role: UserRole.EMPLOYEE,
          status: UserStatus.ACTIVE,
          updatedAt: new Date('2026-05-22T10:00:00Z'),
          department: { id: 'department-1', name: 'Marketing' },
        },
      ],
    },
    company: {
      findUnique: async () => ({
        id: 'company-1',
        name: 'Empresa X',
        businessArea: 'Tecnologia',
      }),
    },
    department: {
      findMany: async () => [
        {
          id: 'department-1',
          name: 'Marketing',
          users: [
            {
              id: 'manager-1',
              name: 'Gestor A',
              role: UserRole.MANAGER,
              status: UserStatus.ACTIVE,
              departmentId: 'department-1',
              updatedAt: new Date('2026-05-21T10:00:00Z'),
            },
            {
              id: 'employee-1',
              name: 'Colaborador A',
              role: UserRole.EMPLOYEE,
              status: UserStatus.ACTIVE,
              departmentId: 'department-1',
              updatedAt: new Date('2026-05-22T10:00:00Z'),
            },
          ],
          cycles: [
            {
              id: 'cycle-1',
              name: 'Ciclo MKT',
              status: 'ACTIVE',
              startDate: new Date('2026-05-01T00:00:00Z'),
              endDate: new Date('2026-06-30T00:00:00Z'),
              updatedAt: new Date('2026-05-22T00:00:00Z'),
              objectives: [
                {
                  id: 'objective-1',
                  name: 'Aumentar receita',
                  updatedAt: new Date('2026-05-22T00:00:00Z'),
                  okrs: [
                    {
                      id: 'okr-1',
                      name: 'Receita trimestral',
                      currentValue: 40,
                      targetValue: 100,
                      responsibleId: 'employee-1',
                      updatedAt: new Date('2026-05-22T00:00:00Z'),
                      responsible: {
                        id: 'employee-1',
                        name: 'Colaborador A',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };

  const useCase = new GetDashboardUseCase(
    prisma as never,
    new DashboardDomainService(),
  );

  const response = await useCase.execute({
    sub: 'director-1',
    email: 'diretora@empresa.com',
    role: UserRole.DIRECTOR,
  });

  assert.equal(response.scope, 'COMPANY');
  assert.equal(response.role, UserRole.DIRECTOR);
  assert.equal(response.kpis.totalDepartments, 1);
  assert.equal(response.kpis.totalEmployees, 3);
  assert.equal(response.widgets.executiveOverview?.departmentPerformance.length, 1);
  assert.equal(response.widgets.teamMembers.length, 3);
  assert.equal(response.permissions.includes('dashboard:view:company'), true);
});

void test('GetDashboardUseCase restricts managers to their department scope', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        name: 'Gestora',
        email: 'gestora@empresa.com',
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
        department: {
          id: 'department-1',
          name: 'Marketing',
        },
      }),
    },
    company: {
      findUnique: async () => ({
        id: 'company-1',
        name: 'Empresa X',
        businessArea: 'Tecnologia',
      }),
    },
    department: {
      findFirst: async () => ({
        id: 'department-1',
        name: 'Marketing',
        users: [
          {
            id: 'manager-1',
            name: 'Gestora',
            email: 'gestora@empresa.com',
            role: UserRole.MANAGER,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: 'company-1',
            departmentId: 'department-1',
            password: 'hash',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'employee-1',
            name: 'Colaborador A',
            email: 'colaborador@empresa.com',
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: 'company-1',
            departmentId: 'department-1',
            password: 'hash',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        cycles: [
          {
            id: 'cycle-1',
            name: 'Ciclo Marketing',
            status: 'ACTIVE',
            startDate: new Date('2026-05-01T00:00:00Z'),
            endDate: new Date('2026-06-30T00:00:00Z'),
            updatedAt: new Date('2026-05-21T00:00:00Z'),
            objectives: [
              {
                id: 'objective-1',
                name: 'Gerar leads',
                updatedAt: new Date('2026-05-20T00:00:00Z'),
                okrs: [
                  {
                    id: 'okr-1',
                    name: 'MQLs',
                    currentValue: 60,
                    targetValue: 100,
                    responsibleId: 'employee-1',
                    updatedAt: new Date('2026-05-22T00:00:00Z'),
                    responsible: {
                      id: 'employee-1',
                      name: 'Colaborador A',
                    },
                  },
                ],
              },
            ],
          },
        ],
      }),
    },
  };

  const useCase = new GetDashboardUseCase(
    prisma as never,
    new DashboardDomainService(),
  );

  const response = await useCase.execute({
    sub: 'manager-1',
    email: 'gestora@empresa.com',
    role: UserRole.MANAGER,
  });

  assert.equal(response.scope, 'DEPARTMENT');
  assert.equal(response.context.department?.id, 'department-1');
  assert.equal(response.widgets.executiveOverview, null);
  assert.equal(response.widgets.departmentOverview?.departmentName, 'Marketing');
  assert.equal(response.widgets.teamMembers.length, 2);
  assert.equal(
    response.widgets.strategicCycles.every((cycle) => cycle.departmentName === 'Marketing'),
    true,
  );
});

void test('GetDashboardUseCase returns only owned OKRs in the employee view', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        name: 'Colaborador',
        email: 'colaborador@empresa.com',
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
        department: {
          id: 'department-1',
          name: 'Marketing',
        },
      }),
    },
    company: {
      findUnique: async () => ({
        id: 'company-1',
        name: 'Empresa X',
        businessArea: 'Tecnologia',
      }),
    },
    department: {
      findFirst: async () => ({
        id: 'department-1',
        name: 'Marketing',
        users: [
          {
            id: 'employee-1',
            name: 'Colaborador',
            email: 'colaborador@empresa.com',
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: 'company-1',
            departmentId: 'department-1',
            password: 'hash',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        cycles: [
          {
            id: 'cycle-1',
            name: 'Ciclo Marketing',
            status: 'ACTIVE',
            startDate: new Date('2026-05-01T00:00:00Z'),
            endDate: new Date('2026-06-30T00:00:00Z'),
            updatedAt: new Date('2026-05-21T00:00:00Z'),
            objectives: [
              {
                id: 'objective-1',
                name: 'Gerar leads',
                updatedAt: new Date('2026-05-20T00:00:00Z'),
                okrs: [
                  {
                    id: 'okr-own',
                    name: 'MQLs',
                    currentValue: 55,
                    targetValue: 100,
                    responsibleId: 'employee-1',
                    updatedAt: new Date('2026-05-22T00:00:00Z'),
                    responsible: {
                      id: 'employee-1',
                      name: 'Colaborador',
                    },
                  },
                  {
                    id: 'okr-other',
                    name: 'SQLs',
                    currentValue: 20,
                    targetValue: 100,
                    responsibleId: 'employee-2',
                    updatedAt: new Date('2026-05-22T00:00:00Z'),
                    responsible: {
                      id: 'employee-2',
                      name: 'Outro colaborador',
                    },
                  },
                ],
              },
            ],
          },
        ],
      }),
    },
  };

  const useCase = new GetDashboardUseCase(
    prisma as never,
    new DashboardDomainService(),
  );

  const response = await useCase.execute({
    sub: 'employee-1',
    email: 'colaborador@empresa.com',
    role: UserRole.EMPLOYEE,
  });

  assert.equal(response.scope, 'EMPLOYEE');
  assert.equal(response.widgets.teamMembers.length, 0);
  assert.equal(response.widgets.okrProgress.length, 1);
  assert.equal(response.widgets.okrProgress[0]?.id, 'okr-own');
  assert.equal(response.kpis.ownOkrs, 1);
});
