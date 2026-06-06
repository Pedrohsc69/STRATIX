import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CycleStatus, type Prisma, type UserRole } from '@prisma/client';
import { PrismaService } from '../../core/shared/prisma.service';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import type { AuditRequestContext } from '../audit/audit.types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { CreateStrategicCycleDto } from './dto/create-strategic-cycle.dto';
import { ListStrategicCyclesDto } from './dto/list-strategic-cycles.dto';
import { UpdateStrategicCycleDto } from './dto/update-strategic-cycle.dto';
import type {
  StrategicCycleDepartmentOption,
  StrategicCycleListItem,
  StrategicCyclesResponse,
} from './strategic-cycles.types';

type StrategicCycleRecord = {
  id: string;
  name: string;
  status: CycleStatus;
  startDate: Date;
  endDate: Date;
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
  objectives: Array<{
    id: string;
    name: string;
    okrs: Array<{
      id: string;
      name: string;
      currentValue: number;
      targetValue: number;
      responsible: {
        id: string;
        name: string;
      };
    }>;
  }>;
};

@Injectable()
export class StrategicCyclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardDomainService: DashboardDomainService,
    private readonly auditService: AuditService,
  ) {}

  async list(
    actor: AuthenticatedUser,
    filters: ListStrategicCyclesDto,
  ): Promise<StrategicCyclesResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      include: {
        company: true,
        department: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const availableDepartments = await this.getVisibleDepartments(user.role, user.companyId, user.departmentId);
    const where = this.buildListWhere(user.role, user.companyId, user.departmentId, filters);
    const cycles = await this.prisma.strategicCycle.findMany({
      where,
      orderBy: [{ endDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        objectives: {
          select: {
            id: true,
            name: true,
            okrs: {
              where: { deletedAt: null },
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

    const cycleItems = cycles
      .map((cycle) => this.mapCycle(cycle))
      .filter((cycle) => this.matchesComputedStatus(cycle.status, filters.status));

    return {
      scope: this.dashboardDomainService.getScope(user.role),
      role: user.role,
      permissions: this.dashboardDomainService.getPermissions(user.role),
      context: {
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
      },
      filters: {
        departments: availableDepartments,
      },
      kpis: this.buildKpis(cycleItems),
      cycles: cycleItems,
    };
  }

  async create(
    actor: AuthenticatedUser,
    input: CreateStrategicCycleDto,
    requestContext?: AuditRequestContext,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!user?.companyId) {
      throw new NotFoundException('User company not found');
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    this.assertDates(startDate, endDate);

    const department = await this.prisma.department.findFirst({
      where: {
        id: input.departmentId,
        companyId: user.companyId,
      },
      select: {
        id: true,
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const created = await this.prisma.strategicCycle.create({
      data: {
        name: input.name.trim(),
        departmentId: department.id,
        startDate,
        endDate,
        status: CycleStatus.ACTIVE,
      },
      include: this.cycleInclude(),
    });

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.CYCLE_CREATED,
      entity: AUDIT_ENTITIES.STRATEGIC_CYCLE,
      entityId: created.id,
      companyId: user.companyId,
      departmentId: created.departmentId,
      newValue: this.toCycleAuditPayload(created),
      requestContext,
    });

    return this.mapCycle(created);
  }

  async update(
    actor: AuthenticatedUser,
    cycleId: string,
    input: UpdateStrategicCycleDto,
    requestContext?: AuditRequestContext,
  ) {
    const actorUser = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: {
        companyId: true,
      },
    });

    if (!actorUser?.companyId) {
      throw new NotFoundException('User company not found');
    }

    const existing = await this.prisma.strategicCycle.findFirst({
      where: {
        id: cycleId,
        department: {
          companyId: actorUser.companyId,
        },
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        objectives: {
          select: {
            id: true,
            name: true,
            okrs: {
              where: { deletedAt: null },
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

    if (!existing) {
      throw new NotFoundException('Strategic cycle not found');
    }

    const oldCycle = this.toCycleAuditPayload(existing);

    const targetDepartmentId = input.departmentId ?? existing.departmentId;

    if (input.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: {
          id: input.departmentId,
          companyId: actorUser.companyId,
        },
        select: { id: true },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    const startDate = input.startDate ? new Date(input.startDate) : existing.startDate;
    const endDate = input.endDate ? new Date(input.endDate) : existing.endDate;
    this.assertDates(startDate, endDate);

    const updated = await this.prisma.strategicCycle.update({
      where: { id: cycleId },
      data: {
        name: input.name?.trim() ?? existing.name,
        departmentId: targetDepartmentId,
        startDate,
        endDate,
      },
      include: this.cycleInclude(),
    });

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.CYCLE_UPDATED,
      entity: AUDIT_ENTITIES.STRATEGIC_CYCLE,
      entityId: updated.id,
      companyId: actorUser.companyId,
      departmentId: updated.departmentId,
      oldValue: oldCycle,
      newValue: this.toCycleAuditPayload(updated),
      requestContext,
    });

    return this.mapCycle(updated);
  }

  async close(
    actor: AuthenticatedUser,
    cycleId: string,
    requestContext?: AuditRequestContext,
  ) {
    const actorUser = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: {
        companyId: true,
      },
    });

    if (!actorUser?.companyId) {
      throw new NotFoundException('User company not found');
    }

    const existing = await this.prisma.strategicCycle.findFirst({
      where: {
        id: cycleId,
        department: {
          companyId: actorUser.companyId,
        },
      },
      include: this.cycleInclude(),
    });

    if (!existing) {
      throw new NotFoundException('Strategic cycle not found');
    }

    const updated = await this.prisma.strategicCycle.update({
      where: { id: cycleId },
      data: {
        status: CycleStatus.CLOSED,
      },
      include: this.cycleInclude(),
    });

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.CYCLE_CLOSED,
      entity: AUDIT_ENTITIES.STRATEGIC_CYCLE,
      entityId: updated.id,
      companyId: actorUser.companyId,
      departmentId: updated.departmentId,
      oldValue: this.toCycleAuditPayload(existing),
      newValue: this.toCycleAuditPayload(updated),
      requestContext,
    });

    return this.mapCycle(updated);
  }

  private buildListWhere(
    role: UserRole,
    companyId: string | null,
    departmentId: string | null,
    filters: ListStrategicCyclesDto,
  ): Prisma.StrategicCycleWhereInput {
    if (!companyId) {
      return { id: '__no-company__' };
    }

    const where: Prisma.StrategicCycleWhereInput = {
      department: {
        companyId,
      },
    };

    if (role === 'DIRECTOR') {
      if (filters.departmentId) {
        where.departmentId = filters.departmentId;
      }
    } else if (departmentId) {
      where.departmentId = departmentId;
    } else {
      where.id = '__no-department__';
    }

    if (filters.search?.trim()) {
      where.name = {
        contains: filters.search.trim(),
        mode: 'insensitive',
      };
    }

    if (filters.status === 'CLOSED') {
      where.status = CycleStatus.CLOSED;
    }

    const andFilters: Prisma.StrategicCycleWhereInput[] = [];

    if (filters.startDate) {
      andFilters.push({
        endDate: {
          gte: new Date(filters.startDate),
        },
      });
    }

    if (filters.endDate) {
      andFilters.push({
        startDate: {
          lte: new Date(filters.endDate),
        },
      });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    return where;
  }

  private async getVisibleDepartments(
    role: UserRole,
    companyId: string | null,
    departmentId: string | null,
  ): Promise<StrategicCycleDepartmentOption[]> {
    if (!companyId) {
      return [];
    }

    if (role === 'DIRECTOR') {
      const departments = await this.prisma.department.findMany({
        where: { companyId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
        },
      });

      return departments;
    }

    if (!departmentId) {
      return [];
    }

    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return department ? [department] : [];
  }

  private matchesComputedStatus(
    status: StrategicCycleListItem['status'],
    filter?: ListStrategicCyclesDto['status'],
  ) {
    if (!filter) {
      return true;
    }

    return status === filter;
  }

  private buildKpis(cycles: StrategicCycleListItem[]) {
    const totalCycles = cycles.length;
    const activeCycles = cycles.filter((cycle) => cycle.status === 'ACTIVE').length;
    const completedCycles = cycles.filter((cycle) => cycle.status === 'CLOSED').length;
    const delayedCycles = cycles.filter((cycle) => cycle.status === 'DELAYED').length;
    const completionRate =
      totalCycles === 0 ? 0 : Math.round((completedCycles / totalCycles) * 100);

    return {
      totalCycles,
      activeCycles,
      completedCycles,
      delayedCycles,
      completionRate,
    };
  }

  private mapCycle(cycle: StrategicCycleRecord): StrategicCycleListItem {
    const okrs = cycle.objectives.flatMap((objective) => objective.okrs);
    const progressValues = okrs.map((okr) =>
      this.dashboardDomainService.calculateProgress(okr.currentValue, okr.targetValue),
    );
    const progress = this.dashboardDomainService.calculateAverageProgress(progressValues);
    const ownerNames = Array.from(new Set(okrs.map((okr) => okr.responsible.name))).sort();

    return {
      id: cycle.id,
      name: cycle.name,
      departmentId: cycle.departmentId,
      departmentName: cycle.department.name,
      status:
        cycle.status === CycleStatus.ACTIVE && cycle.endDate.getTime() < Date.now()
          ? 'DELAYED'
          : cycle.status,
      startDate: cycle.startDate.toISOString(),
      endDate: cycle.endDate.toISOString(),
      progress,
      objectivesCount: cycle.objectives.length,
      okrsCount: okrs.length,
      objectiveNames: cycle.objectives.map((objective) => objective.name),
      ownerNames,
    };
  }

  private assertDates(startDate: Date, endDate: Date) {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid strategic cycle dates');
    }

    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('End date must be greater than or equal to start date');
    }
  }

  private cycleInclude() {
    return {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      objectives: {
        select: {
          id: true,
          name: true,
          okrs: {
            where: { deletedAt: null },
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
    } satisfies Prisma.StrategicCycleInclude;
  }

  private toCycleAuditPayload(cycle: StrategicCycleRecord) {
    return {
      id: cycle.id,
      name: cycle.name,
      departmentId: cycle.departmentId,
      status: cycle.status,
      startDate: cycle.startDate.toISOString(),
      endDate: cycle.endDate.toISOString(),
    };
  }
}
