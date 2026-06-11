import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CycleStatus, UserRole, UserStatus } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { ReportsController } from './reports.controller';
import { PdfLayoutService } from './pdf/pdf-layout.service';
import { PdfReportService } from './pdf/pdf-report.service';
import type { PdfReportDefinition } from './pdf/pdf-types';
import { ReportsService } from './reports.service';

function createPdfService() {
  return new PdfReportService(new PdfLayoutService());
}

function createService(
  prisma: Record<string, unknown>,
  auditService: Record<string, unknown> = { log: async () => undefined },
  pdfService: PdfReportService = createPdfService(),
) {
  return new ReportsService(
    prisma as never,
    new DashboardDomainService(),
    pdfService,
    auditService as never,
  );
}

function createDirectorUser() {
  return {
    id: 'director-1',
    name: 'Diretora',
    role: UserRole.DIRECTOR,
    status: UserStatus.ACTIVE,
    companyId: 'company-1',
    departmentId: null,
    company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
    department: null,
  };
}

function createManagerUser() {
  return {
    id: 'manager-1',
    name: 'Gestora',
    role: UserRole.MANAGER,
    status: UserStatus.ACTIVE,
    companyId: 'company-1',
    departmentId: 'department-1',
    company: { id: 'company-1', name: 'Empresa 1', businessArea: 'Tecnologia' },
    department: { id: 'department-1', name: 'Marketing' },
  };
}

function createCycleRecord() {
  return {
    id: 'cycle-1',
    name: 'Expansao Digital',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-03-31T00:00:00.000Z'),
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
  };
}

void test('ReportsService returns options for the director company only', async () => {
  const service = createService({
    user: {
      findUnique: async () => createDirectorUser(),
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
  assert.deepEqual(response.supportedFormats, ['csv', 'pdf']);
});

void test('ReportsService returns only department-scoped options for manager', async () => {
  const service = createService({
    user: {
      findUnique: async () => createManagerUser(),
    },
    department: {
      findMany: async ({ where }: { where: { companyId: string; id: string } }) => {
        assert.deepEqual(where, { companyId: 'company-1', id: 'department-1' });
        return [{ id: 'department-1', name: 'Marketing' }];
      },
    },
    strategicCycle: {
      findMany: async ({ where }: { where: { department: { companyId: string }; departmentId: string } }) => {
        assert.deepEqual(where, {
          department: { companyId: 'company-1' },
          departmentId: 'department-1',
        });

        return [
          {
            id: 'cycle-1',
            name: 'Expansao',
            status: CycleStatus.ACTIVE,
            departmentId: 'department-1',
            department: { name: 'Marketing' },
          },
        ];
      },
    },
  });

  const response = await service.getOptions({
    sub: 'manager-1',
    email: 'gestora@empresa.com',
    role: UserRole.MANAGER,
  });

  assert.equal(response.role, UserRole.MANAGER);
  assert.equal(response.departments.length, 1);
  assert.equal(response.departments[0]?.id, 'department-1');
  assert.equal(response.cycles.length, 1);
  assert.equal(response.cycles[0]?.departmentId, 'department-1');
});

void test('ReportsService exports company csv for the director company', async () => {
  const service = createService({
    user: {
      findUnique: async () => createDirectorUser(),
    },
    department: {
      count: async () => 1,
    },
    strategicCycle: {
      findMany: async () => [createCycleRecord()],
    },
  });

  const payload = await service.exportCompany(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    { format: 'csv' },
  );

  assert.equal(payload.contentType, 'text/csv; charset=utf-8');
  assert.equal(typeof payload.content, 'string');
  assert.match(payload.content as string, /"Empresa","Departamento","Gestor"/);
  assert.match(payload.content as string, /Empresa 1/);
  assert.match(payload.content as string, /Marketing/);
  assert.match(payload.content as string, /Crescer 20%/);
});

void test('ReportsService exports company pdf and audits the action', async () => {
  const auditCommands: Array<Record<string, unknown>> = [];
  const service = createService(
    {
      user: {
        findUnique: async () => createDirectorUser(),
      },
      department: {
        count: async () => 1,
      },
      strategicCycle: {
        findMany: async () => [createCycleRecord()],
      },
    },
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    },
  );

  const payload = await service.exportCompany(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    { format: 'pdf' },
  );

  assert.equal(payload.contentType, 'application/pdf');
  assert.equal(payload.filename.endsWith('.pdf'), true);
  assert.equal(Buffer.isBuffer(payload.content), true);
  assert.equal((payload.content as Buffer).subarray(0, 4).toString('latin1'), '%PDF');
  assert.equal(auditCommands.length, 1);
  assert.equal(auditCommands[0]?.action, 'REPORT_PDF_GENERATED');
  assert.equal(auditCommands[0]?.entity, 'REPORT');
  assert.deepEqual(auditCommands[0]?.metadata, {
    reportType: 'COMPANY',
    format: 'pdf',
    cycleId: null,
    departmentId: null,
  });
});

void test('ReportsService exports cycle pdf with expected content', async () => {
  let capturedReport: PdfReportDefinition | undefined;
  const service = createService(
    {
      user: {
        findUnique: async () => createDirectorUser(),
      },
      strategicCycle: {
        findFirst: async () => createCycleRecord(),
      },
    },
    { log: async () => undefined },
    {
      generate: async (report: PdfReportDefinition) => {
        capturedReport = report;
        return Buffer.from('%PDF-cycle');
      },
    } as PdfReportService,
  );

  const payload = await service.exportCycle(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    'cycle-1',
    { format: 'pdf' },
  );

  assert.equal(payload.contentType, 'application/pdf');
  assert.equal(Buffer.isBuffer(payload.content), true);
  assert.equal(capturedReport?.reportTitle, 'Relatório por Ciclo Estratégico');
  assert.equal(
    capturedReport?.summary.some((item) => item.label === 'Ciclo' && item.value === 'Expansao Digital'),
    true,
  );
  assert.equal(
    capturedReport?.table.rows.some((row) => row.includes('Aumentar leads') && row.includes('Crescer 20%')),
    true,
  );
});

void test('ReportsService exports department pdf with expected content', async () => {
  let capturedReport: PdfReportDefinition | undefined;
  const service = createService(
    {
      user: {
        findUnique: async () => createDirectorUser(),
      },
      department: {
        findFirst: async () => ({
          id: 'department-1',
          name: 'Marketing',
          company: {
            id: 'company-1',
            name: 'Empresa 1',
          },
          manager: {
            id: 'manager-1',
            name: 'Ana',
          },
          _count: {
            users: 8,
          },
        }),
      },
      strategicCycle: {
        findMany: async () => [createCycleRecord()],
      },
    },
    { log: async () => undefined },
    {
      generate: async (report: PdfReportDefinition) => {
        capturedReport = report;
        return Buffer.from('%PDF-department');
      },
    } as PdfReportService,
  );

  const payload = await service.exportDepartment(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    'department-1',
    { format: 'pdf' },
  );

  assert.equal(payload.contentType, 'application/pdf');
  assert.equal(Buffer.isBuffer(payload.content), true);
  assert.equal(capturedReport?.reportTitle, 'Relatório por Departamento');
  assert.equal(
    capturedReport?.summary.some((item) => item.label === 'Gestor' && item.value === 'Ana'),
    true,
  );
  assert.equal(
    capturedReport?.table.rows.some((row) => row.includes('Crescer 20%') && row.includes('Paula')),
    true,
  );
});

void test('ReportsService does not allow manager to export global reports', async () => {
  const service = createService({
    user: {
      findUnique: async () => createManagerUser(),
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

void test('ReportsService allows manager to export own department report', async () => {
  const auditCommands: Array<Record<string, unknown>> = [];
  const service = createService(
    {
      user: {
        findUnique: async () => createManagerUser(),
      },
      department: {
        findFirst: async () => ({
          id: 'department-1',
          name: 'Marketing',
          company: { id: 'company-1', name: 'Empresa 1' },
          manager: { id: 'manager-1', name: 'Ana' },
          _count: { users: 8 },
        }),
      },
      strategicCycle: {
        findMany: async () => [createCycleRecord()],
      },
    },
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    },
  );

  const payload = await service.exportDepartment(
    { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
    'department-1',
    { format: 'pdf' },
  );

  assert.equal(payload.contentType, 'application/pdf');
  assert.equal(auditCommands.length, 1);
  assert.equal(auditCommands[0]?.companyId, 'company-1');
  assert.equal(auditCommands[0]?.departmentId, 'department-1');
});

void test('ReportsService blocks manager from exporting another department report', async () => {
  const service = createService({
    user: {
      findUnique: async () => createManagerUser(),
    },
  });

  await assert.rejects(
    () =>
      service.exportDepartment(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'department-2',
        { format: 'pdf' },
      ),
    ForbiddenException,
  );
});

void test('ReportsService blocks manager from exporting cycle from another department', async () => {
  const service = createService({
    user: {
      findUnique: async () => createManagerUser(),
    },
    strategicCycle: {
      findFirst: async () => ({
        ...createCycleRecord(),
        department: {
          ...createCycleRecord().department,
          id: 'department-2',
          name: 'Produto',
        },
      }),
    },
  });

  await assert.rejects(
    () =>
      service.exportCycle(
        { sub: 'manager-1', email: 'gestora@empresa.com', role: UserRole.MANAGER },
        'cycle-2',
        { format: 'pdf' },
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
      findUnique: async () => createDirectorUser(),
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
        { format: 'pdf' },
      ),
    NotFoundException,
  );
});

void test('ReportsService blocks company access when department is from another company', async () => {
  const service = createService({
    user: {
      findUnique: async () => createDirectorUser(),
    },
    department: {
      findFirst: async () => null,
    },
    strategicCycle: {
      findMany: async () => [],
    },
  });

  await assert.rejects(
    () =>
      service.exportDepartment(
        { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
        'department-2',
        { format: 'pdf' },
      ),
    NotFoundException,
  );
});

void test('ReportsController keeps company export director-only and allows manager on department-scoped exports', () => {
  const optionsRoles = Reflect.getMetadata(ROLES_KEY, ReportsController.prototype.getOptions) as UserRole[];
  const companyRoles = Reflect.getMetadata(ROLES_KEY, ReportsController.prototype.exportCompany) as UserRole[];
  const cycleRoles = Reflect.getMetadata(ROLES_KEY, ReportsController.prototype.exportCycle) as UserRole[];
  const departmentRoles = Reflect.getMetadata(ROLES_KEY, ReportsController.prototype.exportDepartment) as UserRole[];

  assert.deepEqual(optionsRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
  assert.deepEqual(companyRoles, [UserRole.DIRECTOR]);
  assert.deepEqual(cycleRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
  assert.deepEqual(departmentRoles, [UserRole.DIRECTOR, UserRole.MANAGER]);
});

void test('ReportsController forwards pdf headers and buffer content', async () => {
  const responseHeaders: Record<string, string> = {};
  let sentPayload: string | Buffer | undefined;
  const controller = new ReportsController({
    exportCompany: async () => ({
      filename: 'relatorio-empresa.pdf',
      contentType: 'application/pdf',
      content: Buffer.from('pdf'),
    }),
  } as never);

  const payload = await controller.exportCompany(
    { sub: 'director-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    { format: 'pdf' },
    {
      setHeader: (name: string, value: string) => {
        responseHeaders[name] = value;
      },
      send: (body: string | Buffer) => {
        sentPayload = body;
      },
    },
    {},
  );

  assert.equal(responseHeaders['Content-Type'], 'application/pdf');
  assert.equal(
    responseHeaders['Content-Disposition'],
    'attachment; filename="relatorio-empresa.pdf"',
  );
  assert.equal(payload, undefined);
  assert.equal(Buffer.isBuffer(sentPayload), true);
});
