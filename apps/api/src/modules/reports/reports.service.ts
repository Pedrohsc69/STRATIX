import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CycleStatus, Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../core/shared/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
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

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardDomainService: DashboardDomainService,
  ) {}

  async getOptions(actor: AuthenticatedUser): Promise<ReportsOptionsResponse> {
    const user = await this.getDirectorContext(actor.sub);

    const [departments, cycles] = await Promise.all([
      this.prisma.department.findMany({
        where: { companyId: user.companyId },
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
      supportedFormats: ['csv'],
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
  ): Promise<ReportExportPayload> {
    this.assertSupportedFormat(query.format);
    const user = await this.getDirectorContext(actor.sub);
    const cycles = await this.listCompanyCycles(user.companyId);

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

  async exportCycle(
    actor: AuthenticatedUser,
    cycleId: string,
    query: ReportFormatDto,
  ): Promise<ReportExportPayload> {
    this.assertSupportedFormat(query.format);
    const user = await this.getDirectorContext(actor.sub);
    const cycle = await this.findCompanyCycleById(user.companyId, cycleId);

    if (!cycle) {
      throw new NotFoundException('Strategic cycle not found');
    }

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

  async exportDepartment(
    actor: AuthenticatedUser,
    departmentId: string,
    query: ReportFormatDto,
  ): Promise<ReportExportPayload> {
    this.assertSupportedFormat(query.format);
    const user = await this.getDirectorContext(actor.sub);
    const cycles = await this.listDepartmentCycles(user.companyId, departmentId);

    if (cycles.length === 0) {
      const department = await this.prisma.department.findFirst({
        where: {
          id: departmentId,
          companyId: user.companyId,
        },
        select: { id: true, name: true },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }

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
        ]),
      };
    }

    const rows = this.buildDepartmentRows(cycles);

    return {
      filename: `relatorio-departamento-${this.slugify(cycles[0]?.department.name ?? 'departamento')}.csv`,
      contentType: 'text/csv; charset=utf-8',
      content: this.toCsv(
        [
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
        ],
      ),
    };
  }

  private async getDirectorContext(userId: string): Promise<ReportsContextUser> {
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

    if (user.role !== UserRole.DIRECTOR) {
      throw new ForbiddenException('Access denied');
    }

    if (!user.companyId) {
      throw new BadRequestException('Company must be created first');
    }

    return {
      ...user,
      companyId: user.companyId,
    };
  }

  private assertSupportedFormat(format: ReportFormat) {
    if (format !== 'csv') {
      throw new BadRequestException('Only CSV export is available right now');
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

  private buildCompanyRows(cycles: ReportCycleRecord[]) {
    return cycles.flatMap((cycle) => {
      const objectives = cycle.objectives.length > 0 ? cycle.objectives : [{ id: '', name: '', okrs: [] }];

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
    const objectives = cycle.objectives.length > 0 ? cycle.objectives : [{ id: '', name: '', okrs: [] }];

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
      const objectives = cycle.objectives.length > 0 ? cycle.objectives : [{ id: '', name: '', okrs: [] }];

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

  private getCycleStatusLabel(status: CycleStatus) {
    return status === CycleStatus.ACTIVE ? 'Ativo' : 'Fechado';
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
