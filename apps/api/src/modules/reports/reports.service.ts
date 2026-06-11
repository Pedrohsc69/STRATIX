import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CycleStatus, Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../core/shared/prisma.service';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import type { AuditRequestContext } from '../audit/audit.types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { PdfReportService } from './pdf/pdf-report.service';
import type { PdfReportDefinition } from './pdf/pdf-types';
import { ReportFormatDto } from './dto/report-format.dto';
import type {
  ReportCycleOption,
  ReportDepartmentOption,
  ReportExportPayload,
  ReportFormat,
  ReportsOptionsResponse,
} from './reports.types';

const reportCycleInclude = Prisma.validator<Prisma.StrategicCycleDefaultArgs>()({
  include: {
    department: {
      select: {
        id: true,
        name: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            businessArea: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    objectives: {
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        okrs: {
          where: { deletedAt: null },
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            name: true,
            currentValue: true,
            targetValue: true,
            responsible: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    },
  },
});

type ReportCycleRecord = Prisma.StrategicCycleGetPayload<typeof reportCycleInclude>;
const reportCycleOptionSelect = Prisma.validator<Prisma.StrategicCycleDefaultArgs>()({
  select: {
    id: true,
    name: true,
    status: true,
    departmentId: true,
    department: {
      select: {
        name: true,
      },
    },
  },
});

type ReportCycleOptionRecord = Prisma.StrategicCycleGetPayload<typeof reportCycleOptionSelect>;
type ReportsContextUser = {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  companyId: string;
  departmentId: string | null;
  company: {
    id: string;
    name: string;
    businessArea: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
};

type ReportDepartmentDetails = {
  id: string;
  name: string;
  company: {
    id: string;
    name: string;
  };
  manager: {
    id: string;
    name: string;
  } | null;
  _count: {
    users: number;
  };
};

type CompanyDepartmentAggregate = {
  departmentName: string;
  managerName: string;
  cyclesCount: number;
  objectivesCount: number;
  okrsCount: number;
  averageProgress: number;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardDomainService: DashboardDomainService,
    private readonly pdfReportService: PdfReportService,
    private readonly auditService: AuditService,
  ) {}

  async getOptions(actor: AuthenticatedUser): Promise<ReportsOptionsResponse> {
    const user = await this.getReportsContext(actor.sub);

    const [departments, cycles] = await Promise.all([
      this.prisma.department.findMany({
        where: {
          companyId: user.companyId,
          ...(user.role === UserRole.MANAGER ? { id: user.departmentId ?? '__no-department__' } : {}),
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: [{ name: 'asc' }],
      }),
      this.prisma.strategicCycle.findMany({
        where: {
          department: {
            companyId: user.companyId,
          },
          ...(user.role === UserRole.MANAGER
            ? { departmentId: user.departmentId ?? '__no-department__' }
            : {}),
        },
        ...reportCycleOptionSelect,
        orderBy: [{ createdAt: 'desc' }],
      }) as Promise<ReportCycleOptionRecord[]>,
    ]);

    return {
      scope: this.dashboardDomainService.getScope(user.role),
      role: user.role,
      permissions: this.dashboardDomainService.getPermissions(user.role),
      context: this.buildContext(user),
      supportedFormats: ['csv', 'pdf'],
      departments: departments.map(
        (department): ReportDepartmentOption => ({
          id: department.id,
          name: department.name,
        }),
      ),
      cycles: cycles.map(
        (cycle): ReportCycleOption => ({
          id: cycle.id,
          name: cycle.name,
          departmentId: cycle.departmentId,
          departmentName: cycle.department.name,
          status: cycle.status,
        }),
      ),
    };
  }

  async exportCompany(
    actor: AuthenticatedUser,
    query: ReportFormatDto,
    requestContext?: AuditRequestContext,
  ): Promise<ReportExportPayload> {
    this.assertSupportedFormat(query.format);
    const user = await this.getReportsContext(actor.sub);

    if (user.role !== UserRole.DIRECTOR) {
      throw new ForbiddenException('Managers cannot export company-wide reports');
    }

    const [cycles, departmentsCount] = await Promise.all([
      this.listCompanyCycles(user.companyId),
      this.prisma.department.count({
        where: { companyId: user.companyId },
      }),
    ]);

    if (query.format === 'csv') {
      const rows = this.buildCompanyRows(cycles);

      return {
        filename: `relatorio-empresa-${this.slugify(user.company?.name ?? 'empresa')}.csv`,
        contentType: 'text/csv; charset=utf-8',
        content: this.toCsv(
          [
            [
              'Empresa',
              'Departamento',
              'Gestor',
              'Ciclo',
              'Status do ciclo',
              'Objetivo',
              'OKR',
              'Responsável',
              'Valor atual',
              'Valor meta',
              'Progresso',
            ],
            ...rows,
          ],
        ),
      };
    }

    const content = await this.pdfReportService.generate(
      this.buildCompanyPdfDefinition(user.company?.name ?? 'Empresa', departmentsCount, cycles),
    );

    await this.logPdfAudit(actor, user, 'COMPANY', requestContext);

    return {
      filename: `relatorio-empresa-${this.slugify(user.company?.name ?? 'empresa')}.pdf`,
      contentType: 'application/pdf',
      content,
    };
  }

  async exportCycle(
    actor: AuthenticatedUser,
    cycleId: string,
    query: ReportFormatDto,
    requestContext?: AuditRequestContext,
  ): Promise<ReportExportPayload> {
    this.assertSupportedFormat(query.format);
    const user = await this.getReportsContext(actor.sub);
    const cycle = await this.findCycleForReport(user, cycleId);

    if (!cycle) {
      throw new NotFoundException('Strategic cycle not found');
    }

    if (query.format === 'csv') {
      const rows = this.buildCycleRows(cycle);

      return {
        filename: `relatorio-ciclo-${this.slugify(cycle.name)}.csv`,
        contentType: 'text/csv; charset=utf-8',
        content: this.toCsv(
          [
            [
              'Ciclo',
              'Departamento',
              'Objetivo',
              'OKR',
              'Responsável',
              'Valor atual',
              'Valor meta',
              'Progresso',
              'Status',
            ],
            ...rows,
          ],
        ),
      };
    }

    const content = await this.pdfReportService.generate(this.buildCyclePdfDefinition(cycle));

    await this.logPdfAudit(actor, user, 'CYCLE', requestContext, cycleId);

    return {
      filename: `relatorio-ciclo-${this.slugify(cycle.name)}.pdf`,
      contentType: 'application/pdf',
      content,
    };
  }

  async exportDepartment(
    actor: AuthenticatedUser,
    departmentId: string,
    query: ReportFormatDto,
    requestContext?: AuditRequestContext,
  ): Promise<ReportExportPayload> {
    this.assertSupportedFormat(query.format);
    const user = await this.getReportsContext(actor.sub);
    this.assertManagerDepartmentScope(user, departmentId);

    const [department, cycles] = await Promise.all([
      this.findDepartmentInCompany(user.companyId, departmentId),
      this.listDepartmentCycles(user.companyId, departmentId),
    ]);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (query.format === 'csv') {
      const rows = this.buildDepartmentRows(cycles);

      return {
        filename: `relatorio-departamento-${this.slugify(department.name)}.csv`,
        contentType: 'text/csv; charset=utf-8',
        content: this.toCsv([
          [
            'Departamento',
            'Gestor',
            'Ciclo',
            'Objetivo',
            'OKR',
            'Responsável',
            'Progresso',
          ],
          ...rows,
        ]),
      };
    }

    const content = await this.pdfReportService.generate(
      this.buildDepartmentPdfDefinition(department, cycles),
    );

    await this.logPdfAudit(actor, user, 'DEPARTMENT', requestContext, undefined, departmentId);

    return {
      filename: `relatorio-departamento-${this.slugify(department.name)}.pdf`,
      contentType: 'application/pdf',
      content,
    };
  }

  private async getReportsContext(userId: string): Promise<ReportsContextUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        department: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.DIRECTOR && user.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Access denied');
    }

    if (!user.companyId) {
      throw new BadRequestException('Company must be created first');
    }

    if (user.role === UserRole.MANAGER && !user.departmentId) {
      throw new ForbiddenException('Manager must belong to a department to export reports');
    }

    return {
      ...user,
      companyId: user.companyId,
    };
  }

  private assertSupportedFormat(format: ReportFormat) {
    if (format !== 'csv' && format !== 'pdf') {
      throw new BadRequestException('Unsupported report format');
    }
  }

  private async listCompanyCycles(companyId: string): Promise<ReportCycleRecord[]> {
    return (await this.prisma.strategicCycle.findMany({
      where: {
        department: {
          companyId,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      ...reportCycleInclude,
    })) as ReportCycleRecord[];
  }

  private async findCompanyCycleById(
    companyId: string,
    cycleId: string,
  ): Promise<ReportCycleRecord | null> {
    return (await this.prisma.strategicCycle.findFirst({
      where: {
        id: cycleId,
        department: {
          companyId,
        },
      },
      ...reportCycleInclude,
    })) as ReportCycleRecord | null;
  }

  private async findCycleForReport(
    user: ReportsContextUser,
    cycleId: string,
  ): Promise<ReportCycleRecord | null> {
    const cycle = await this.findCompanyCycleById(user.companyId, cycleId);

    if (!cycle) {
      return null;
    }

    this.assertManagerDepartmentScope(user, cycle.department.id);

    return cycle;
  }

  private async listDepartmentCycles(
    companyId: string,
    departmentId: string,
  ): Promise<ReportCycleRecord[]> {
    return (await this.prisma.strategicCycle.findMany({
      where: {
        departmentId,
        department: {
          companyId,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      ...reportCycleInclude,
    })) as ReportCycleRecord[];
  }

  private async findDepartmentInCompany(
    companyId: string,
    departmentId: string,
  ): Promise<ReportDepartmentDetails | null> {
    return this.prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId,
      },
      select: {
        id: true,
        name: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    }) as Promise<ReportDepartmentDetails | null>;
  }

  private buildCompanyRows(cycles: ReportCycleRecord[]) {
    return cycles.flatMap((cycle) => {
      const objectives =
        cycle.objectives.length > 0 ? cycle.objectives : [{ id: '', name: '', okrs: [] }];

      return objectives.flatMap((objective) => {
        const okrs = objective.okrs.length > 0 ? objective.okrs : [null];

        return okrs.map((okr) => [
          cycle.department.company.name,
          cycle.department.name,
          cycle.department.manager?.name ?? 'Sem gestor atribuído',
          cycle.name,
          this.getCycleStatusLabel(cycle.status),
          objective.name,
          okr?.name ?? '',
          okr?.responsible.name ?? '',
          okr ? String(okr.currentValue) : '',
          okr ? String(okr.targetValue) : '',
          okr
            ? `${this.dashboardDomainService.calculateProgress(okr.currentValue, okr.targetValue)}%`
            : '',
        ]);
      });
    });
  }

  private buildCycleRows(cycle: ReportCycleRecord) {
    const objectives =
      cycle.objectives.length > 0 ? cycle.objectives : [{ id: '', name: '', okrs: [] }];

    return objectives.flatMap((objective) => {
      const okrs = objective.okrs.length > 0 ? objective.okrs : [null];

      return okrs.map((okr) => [
        cycle.name,
        cycle.department.name,
        objective.name,
        okr?.name ?? '',
        okr?.responsible.name ?? '',
        okr ? String(okr.currentValue) : '',
        okr ? String(okr.targetValue) : '',
        okr
          ? `${this.dashboardDomainService.calculateProgress(okr.currentValue, okr.targetValue)}%`
          : '',
        this.getCycleStatusLabel(cycle.status),
      ]);
    });
  }

  private buildDepartmentRows(cycles: ReportCycleRecord[]) {
    return cycles.flatMap((cycle) => {
      const objectives =
        cycle.objectives.length > 0 ? cycle.objectives : [{ id: '', name: '', okrs: [] }];

      return objectives.flatMap((objective) => {
        const okrs = objective.okrs.length > 0 ? objective.okrs : [null];

        return okrs.map((okr) => [
          cycle.department.name,
          cycle.department.manager?.name ?? 'Sem gestor atribuído',
          cycle.name,
          objective.name,
          okr?.name ?? '',
          okr?.responsible.name ?? '',
          okr
            ? `${this.dashboardDomainService.calculateProgress(okr.currentValue, okr.targetValue)}%`
            : '',
        ]);
      });
    });
  }

  private buildCompanyPdfDefinition(
    companyName: string,
    departmentsCount: number,
    cycles: ReportCycleRecord[],
  ): PdfReportDefinition {
    const objectivesCount = this.countObjectives(cycles);
    const okrsCount = this.countOkrs(cycles);
    const averageProgress = this.calculateAverageProgress(cycles);
    const departmentRows = this.buildCompanyDepartmentAggregates(cycles);

    return {
      reportTitle: 'Relatório Geral da Empresa',
      companyName,
      generatedAt: new Date(),
      summary: [
        { label: 'Total de departamentos', value: String(departmentsCount) },
        { label: 'Total de ciclos', value: String(cycles.length) },
        { label: 'Total de objetivos', value: String(objectivesCount) },
        { label: 'Total de OKRs', value: String(okrsCount) },
        { label: 'Progresso médio', value: `${averageProgress}%` },
      ],
      table: {
        columns: [
          { label: 'Departamento', width: 118 },
          { label: 'Gestor', width: 110 },
          { label: 'Ciclos', width: 52, align: 'center' },
          { label: 'Objetivos', width: 60, align: 'center' },
          { label: 'OKRs', width: 52, align: 'center' },
          { label: 'Progresso', width: 76, align: 'center' },
        ],
        rows: departmentRows.map((item) => [
          item.departmentName,
          item.managerName,
          String(item.cyclesCount),
          String(item.objectivesCount),
          String(item.okrsCount),
          `${item.averageProgress}%`,
        ]),
        emptyMessage: 'Nenhum ciclo estratégico encontrado para a empresa.',
      },
    };
  }

  private buildCyclePdfDefinition(cycle: ReportCycleRecord): PdfReportDefinition {
    const okrs = this.collectOkrs([cycle]);
    const period = `${this.formatDate(cycle.startDate)} - ${this.formatDate(cycle.endDate)}`;

    return {
      reportTitle: 'Relatório por Ciclo Estratégico',
      companyName: cycle.department.company.name,
      generatedAt: new Date(),
      summary: [
        { label: 'Ciclo', value: cycle.name },
        { label: 'Departamento', value: cycle.department.name },
        { label: 'Período', value: period },
        { label: 'Status', value: this.getCycleStatusLabel(cycle.status) },
        { label: 'Total de objetivos', value: String(cycle.objectives.length) },
        { label: 'Total de OKRs', value: String(okrs.length) },
        { label: 'Progresso médio', value: `${this.calculateAverageProgress([cycle])}%` },
      ],
      table: {
        columns: [
          { label: 'Objetivo', width: 132 },
          { label: 'OKR', width: 132 },
          { label: 'Responsável', width: 92 },
          { label: 'Atual', width: 44, align: 'center' },
          { label: 'Meta', width: 44, align: 'center' },
          { label: 'Progresso', width: 54, align: 'center' },
        ],
        rows: this.buildCycleRows(cycle).map((row) => row.slice(2, 8)),
        emptyMessage: 'Nenhum objetivo ou OKR encontrado neste ciclo.',
      },
    };
  }

  private buildDepartmentPdfDefinition(
    department: ReportDepartmentDetails,
    cycles: ReportCycleRecord[],
  ): PdfReportDefinition {
    return {
      reportTitle: 'Relatório por Departamento',
      companyName: department.company.name,
      generatedAt: new Date(),
      summary: [
        { label: 'Departamento', value: department.name },
        { label: 'Gestor', value: department.manager?.name ?? 'Não informado' },
        { label: 'Colaboradores', value: String(department._count.users) },
        { label: 'Total de ciclos', value: String(cycles.length) },
        { label: 'Total de objetivos', value: String(this.countObjectives(cycles)) },
        { label: 'Total de OKRs', value: String(this.countOkrs(cycles)) },
      ],
      table: {
        columns: [
          { label: 'Ciclo', width: 94 },
          { label: 'Objetivo', width: 132 },
          { label: 'OKR', width: 132 },
          { label: 'Responsável', width: 86 },
          { label: 'Progresso', width: 54, align: 'center' },
        ],
        rows: this.buildDepartmentRows(cycles).map((row) => row.slice(2)),
        emptyMessage: 'Nenhum ciclo estratégico encontrado para o departamento.',
      },
    };
  }

  private buildCompanyDepartmentAggregates(cycles: ReportCycleRecord[]) {
    const departmentMap = new Map<string, CompanyDepartmentAggregate & { progresses: number[] }>();

    cycles.forEach((cycle) => {
      const key = cycle.department.id;
      const current =
        departmentMap.get(key) ??
        ({
          departmentName: cycle.department.name,
          managerName: cycle.department.manager?.name ?? 'Sem gestor atribuído',
          cyclesCount: 0,
          objectivesCount: 0,
          okrsCount: 0,
          averageProgress: 0,
          progresses: [],
        } satisfies CompanyDepartmentAggregate & { progresses: number[] });

      current.cyclesCount += 1;
      current.objectivesCount += cycle.objectives.length;

      cycle.objectives.forEach((objective) => {
        current.okrsCount += objective.okrs.length;
        objective.okrs.forEach((okr) => {
          current.progresses.push(
            this.dashboardDomainService.calculateProgress(okr.currentValue, okr.targetValue),
          );
        });
      });

      departmentMap.set(key, current);
    });

    return [...departmentMap.values()]
      .map((item) => ({
        departmentName: item.departmentName,
        managerName: item.managerName,
        cyclesCount: item.cyclesCount,
        objectivesCount: item.objectivesCount,
        okrsCount: item.okrsCount,
        averageProgress: this.dashboardDomainService.calculateAverageProgress(item.progresses),
      }))
      .sort((left, right) => left.departmentName.localeCompare(right.departmentName));
  }

  private collectOkrs(cycles: ReportCycleRecord[]) {
    return cycles.flatMap((cycle) =>
      cycle.objectives.flatMap((objective) =>
        objective.okrs.map((okr) => ({
          currentValue: okr.currentValue,
          targetValue: okr.targetValue,
        })),
      ),
    );
  }

  private countObjectives(cycles: ReportCycleRecord[]) {
    return cycles.reduce((total, cycle) => total + cycle.objectives.length, 0);
  }

  private countOkrs(cycles: ReportCycleRecord[]) {
    return cycles.reduce(
      (total, cycle) =>
        total + cycle.objectives.reduce((objectiveTotal, objective) => objectiveTotal + objective.okrs.length, 0),
      0,
    );
  }

  private calculateAverageProgress(cycles: ReportCycleRecord[]) {
    const progresses = this.collectOkrs(cycles).map((okr) =>
      this.dashboardDomainService.calculateProgress(okr.currentValue, okr.targetValue),
    );

    return this.dashboardDomainService.calculateAverageProgress(progresses);
  }

  private async logPdfAudit(
    actor: AuthenticatedUser,
    user: ReportsContextUser,
    reportType: 'COMPANY' | 'CYCLE' | 'DEPARTMENT',
    requestContext?: AuditRequestContext,
    cycleId?: string,
    departmentId?: string,
  ) {
    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.REPORT_PDF_GENERATED,
      entity: AUDIT_ENTITIES.REPORT,
      entityId: cycleId ?? departmentId ?? user.companyId,
      companyId: user.companyId,
      departmentId: departmentId ?? null,
      metadata: {
        reportType,
        format: 'pdf',
        cycleId: cycleId ?? null,
        departmentId: departmentId ?? null,
      },
      requestContext,
    });
  }

  private assertManagerDepartmentScope(user: ReportsContextUser, departmentId: string) {
    if (user.role !== UserRole.MANAGER) {
      return;
    }

    if (!user.departmentId) {
      throw new ForbiddenException('Manager must belong to a department to export reports');
    }

    if (departmentId !== user.departmentId) {
      throw new ForbiddenException('Managers can only export reports from their own department');
    }
  }

  private getCycleStatusLabel(status: CycleStatus) {
    return status === CycleStatus.ACTIVE ? 'Ativo' : 'Fechado';
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('pt-BR').format(value);
  }

  private toCsv(rows: string[][]) {
    return rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private buildContext(user: ReportsContextUser) {
    return {
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            businessArea: user.company.businessArea,
          }
        : null,
      department: user.department
        ? {
            id: user.department.id,
            name: user.department.name,
          }
        : null,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    };
  }
}
