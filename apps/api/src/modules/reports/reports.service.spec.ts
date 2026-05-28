import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CycleStatus, UserRole, UserStatus } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

function createService(prisma: Record<string, unknown>) {
  return new ReportsService(prisma as never, new DashboardDomainService());
}

void test('ReportsService returns options for the director company only', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'director-1',
        name: 'Diretora',
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
      findMany: async () => [
        {
          id: 'cycle-1',
          name: 'Expansao',
          status: CycleStatus.ACTIVE,
          departmentId: 'department-1',
          department: { name: 'Marketing' },
        },
      ],
    },
  });

  const response = await service.getOptions({
    sub: 'director-1',
    email: 'diretora@empresa.com',
    role: UserRole.DIRECTOR,
  });

  assert.equal(response.departments.length, 1);
  assert.equal(response.cycles.length, 1);
  assert.deepEqual(response.supportedFormats, ['csv']);
});

void test('ReportsService exports company csv for the director company', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'director-1',
        name: 'Diretora',
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        companyId: 'company-1',
        departmentId: null,
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: null,
      }),
    },
    strategicCycle: {
      findMany: async () => [
        {
          id: 'cycle-1',
          name: 'Expansao Digital',
          status: CycleStatus.ACTIVE,
          department: {
            id: 'department-1',
            name: 'Marketing',
            companyId: 'company-1',
            company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
            manager: { id: 'manager-1', name: 'Ana' },
          },
          objectives: [
            {
              id: 'objective-1',
              name: 'Aumentar leads',
              okrs: [
                {
                  id: 'okr-1',
                  name: 'Crescer 20%',
                  currentValue: 10,
                  targetValue: 20,
                  responsible: { id: 'user-1', name: 'Paula' },
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const payload = await service.exportCompany(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    { format: 'csv' },
  );

  assert.match(payload.content, /"Empresa","Departamento","Gestor"/);
  assert.match(payload.content, /Empresa 1/);
  assert.match(payload.content, /Marketing/);
  assert.match(payload.content, /Crescer 20%/);
});

void test('ReportsService does not allow manager to export global reports', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'manager-1',
        name: 'Gestora',
        role: UserRole.MANAGER,
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
      service.exportCompany(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        { format: 'csv' },
      ),
    ForbiddenException,
  );
});

void test('ReportsService does not allow employee to export reports', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'employee-1',
        name: 'Colaboradora',
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
      service.exportCompany(
        { sub: 'employee-1', email: 'colaboradora@empresa.com', role: UserRole.EMPLOYEE },
        { format: 'csv' },
      ),
    ForbiddenException,
  );
});

void test('ReportsService blocks company access when cycle is from another company', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'director-1',
        name: 'Diretora',
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        companyId: 'company-1',
        departmentId: null,
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: null,
      }),
    },
    strategicCycle: {
      findFirst: async () => null,
    },
  });

  await assert.rejects(
    () =>
      service.exportCycle(
        { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
        'cycle-2',
        { format: 'csv' },
      ),
    NotFoundException,
  );
});

void test('ReportsService blocks company access when department is from another company', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        id: 'director-1',
        name: 'Diretora',
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        companyId: 'company-1',
        departmentId: null,
        company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
        department: null,
      }),
    },
    strategicCycle: {
      findMany: async () => [],
    },
    department: {
      findFirst: async () => null,
    },
  });

  await assert.rejects(
    () =>
      service.exportDepartment(
        { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
        'department-2',
        { format: 'csv' },
      ),
    NotFoundException,
  );
});

void test('ReportsController protects options and exports for directors only', () => {
  const optionsRoles = Reflect.getMetadata(ROLES_KEY, ReportsController.prototype.getOptions) as UserRole[];
  const companyRoles = Reflect.getMetadata(ROLES_KEY, ReportsController.prototype.exportCompany) as UserRole[];
  const cycleRoles = Reflect.getMetadata(ROLES_KEY, ReportsController.prototype.exportCycle) as UserRole[];
  const departmentRoles = Reflect.getMetadata(ROLES_KEY, ReportsController.prototype.exportDepartment) as UserRole[];

  assert.deepEqual(optionsRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(companyRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(cycleRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(departmentRoles, [UserRole.DIRECTOR]);
});
