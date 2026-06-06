import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CycleStatus, OKRMetricType, type Prisma, type UserRole } from '@prisma/client';
import { PrismaService } from '../../core/shared/prisma.service';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import type { AuditRequestContext } from '../audit/audit.types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import {
  assertCycleIsEditable,
  isCycleEditable,
} from '../strategic-cycles/utils/cycle-editability';
import { AddOkrProgressDto } from './dto/add-okr-progress.dto';
import { CreateOkrDto } from './dto/create-okr.dto';
import { ListOkrsDto } from './dto/list-okrs.dto';
import { UpdateOkrDto } from './dto/update-okr.dto';
import type {
  OkrCycleOption,
  OkrItem,
  OkrObjectiveOption,
  OkrResponsibleOption,
  OkrStatus,
  OkrsResponse,
} from './okrs.types';
import { normalizeOkrValue, validateOkrValues } from './okr-metric.utils';

type OkrRecord = {
  id: string;
  name: string;
  metricType: OKRMetricType;
  objectiveId: string;
  currentValue: number;
  targetValue: number;
  responsibleId: string;
  createdAt: Date;
  updatedAt: Date;
  responsible: {
    id: string;
    name: string;
    departmentId: string | null;
  };
  objective: {
    id: string;
    name: string;
    cycleId: string;
    cycle: {
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
    };
  };
  progress: Array<{
    id: string;
    value: number;
    date: Date;
    comment: string;
  }>;
};

@Injectable()
export class OkrsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardDomainService: DashboardDomainService,
    private readonly auditService: AuditService,
  ) {}

  async list(actor: AuthenticatedUser, filters: ListOkrsDto): Promise<OkrsResponse> {
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

    const [departments, cycles, objectives, responsibles, okrs] = await Promise.all([
      this.getVisibleDepartments(user.role, user.companyId, user.departmentId),
      this.getVisibleCycles(user.role, user.companyId, user.departmentId),
      this.getVisibleObjectives(user.role, user.companyId, user.departmentId),
      this.getVisibleResponsibles(user.role, user.companyId, user.departmentId),
      this.prisma.oKR.findMany({
        where: this.buildListWhere(
          user.role,
          user.companyId,
          user.departmentId,
          actor.sub,
          filters,
        ),
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        include: this.okrInclude(),
      }),
    ]);

    const okrItems = okrs
      .map((okr) => this.mapOkr(okr, actor.sub))
      .filter((okr) => this.matchesStatus(okr.status, filters.status));

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
        departments,
        cycles,
        objectives,
        responsibles,
      },
      kpis: this.buildKpis(okrItems),
      okrs: okrItems,
    };
  }

  async create(
    actor: AuthenticatedUser,
    input: CreateOkrDto,
    requestContext?: AuditRequestContext,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: {
        companyId: true,
        departmentId: true,
        role: true,
      },
    });

    if (!user?.companyId) {
      throw new NotFoundException('User company not found');
    }

    const objective = await this.findObjectiveInScope(
      user.role,
      user.companyId,
      user.departmentId,
      input.objectiveId,
    );
    assertCycleIsEditable(
      objective.cycle,
      'OKRs can only be changed while the strategic cycle is active',
    );

    const responsible = await this.findResponsibleInScope(
      user.role,
      user.companyId,
      user.departmentId,
      objective.cycle.departmentId,
      input.responsibleId,
    );

    const metricType = input.metricType ?? OKRMetricType.NUMBER;
    const normalizedValues = validateOkrValues({
      metricType,
      currentValue: input.currentValue ?? 0,
      targetValue: input.targetValue,
    });

    const created = await this.prisma.oKR.create({
      data: {
        name: input.name.trim(),
        metricType,
        objectiveId: objective.id,
        responsibleId: responsible.id,
        currentValue: normalizedValues.currentValue,
        targetValue: normalizedValues.targetValue,
      },
      include: this.okrInclude(),
    });

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.OKR_CREATED,
      entity: AUDIT_ENTITIES.OKR,
      entityId: created.id,
      companyId: user.companyId,
      departmentId: created.objective.cycle.departmentId,
      newValue: this.toOkrAuditPayload(created),
      requestContext,
    });

    return this.mapOkr(created, actor.sub);
  }

  async update(
    actor: AuthenticatedUser,
    okrId: string,
    input: UpdateOkrDto,
    requestContext?: AuditRequestContext,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: {
        companyId: true,
        departmentId: true,
        role: true,
      },
    });

    if (!user?.companyId) {
      throw new NotFoundException('User company not found');
    }

    const existing = await this.prisma.oKR.findFirst({
      where: this.buildOkrScopeWhere(user.role, user.companyId, user.departmentId, okrId),
      include: this.okrInclude(),
    });

    if (!existing) {
      throw new NotFoundException('OKR not found');
    }

    const oldOkr = this.toOkrAuditPayload(existing);

    assertCycleIsEditable(
      existing.objective.cycle,
      'OKRs can only be changed while the strategic cycle is active',
    );

    const targetObjective =
      input.objectiveId && input.objectiveId !== existing.objectiveId
        ? await this.findObjectiveInScope(
            user.role,
            user.companyId,
            user.departmentId,
            input.objectiveId,
          )
        : existing.objective;

    assertCycleIsEditable(
      targetObjective.cycle,
      'OKRs can only be changed while the strategic cycle is active',
    );

    const targetResponsibleId = input.responsibleId ?? existing.responsibleId;
    const responsible = await this.findResponsibleInScope(
      user.role,
      user.companyId,
      user.departmentId,
      targetObjective.cycle.departmentId,
      targetResponsibleId,
    );

    const metricType = input.metricType ?? existing.metricType ?? OKRMetricType.NUMBER;
    const normalizedValues = validateOkrValues({
      metricType,
      currentValue: input.currentValue ?? existing.currentValue,
      targetValue: input.targetValue ?? existing.targetValue,
    });

    const updated = await this.prisma.oKR.update({
      where: { id: okrId },
      data: {
        name: input.name?.trim() ?? existing.name,
        metricType,
        objectiveId: targetObjective.id,
        responsibleId: responsible.id,
        currentValue: normalizedValues.currentValue,
        targetValue: normalizedValues.targetValue,
      },
      include: this.okrInclude(),
    });

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.OKR_UPDATED,
      entity: AUDIT_ENTITIES.OKR,
      entityId: updated.id,
      companyId: user.companyId,
      departmentId: updated.objective.cycle.departmentId,
      oldValue: oldOkr,
      newValue: this.toOkrAuditPayload(updated),
      requestContext,
    });

    return this.mapOkr(updated, actor.sub);
  }

  async remove(actor: AuthenticatedUser, okrId: string, requestContext?: AuditRequestContext) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: {
        companyId: true,
        departmentId: true,
        role: true,
      },
    });

    if (!user?.companyId) {
      throw new NotFoundException('User company not found');
    }

    const okr = await this.prisma.oKR.findFirst({
      where: this.buildOkrScopeWhere(user.role, user.companyId, user.departmentId, okrId),
      include: this.okrInclude(),
    });

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    assertCycleIsEditable(
      okr.objective.cycle,
      'OKRs can only be changed while the strategic cycle is active',
    );

    if (okr.progress.length > 0) {
      throw new BadRequestException('OKR has progress history and cannot be deleted');
    }

    await this.prisma.oKR.update({
      where: { id: okrId },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.OKR_DELETED,
      entity: AUDIT_ENTITIES.OKR,
      entityId: okr.id,
      companyId: user.companyId,
      departmentId: okr.objective.cycle.departmentId,
      oldValue: this.toOkrAuditPayload(okr),
      newValue: null,
      requestContext,
    });

    return { success: true };
  }

  async addProgress(
    actor: AuthenticatedUser,
    okrId: string,
    input: AddOkrProgressDto,
    requestContext?: AuditRequestContext,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: {
        companyId: true,
        departmentId: true,
        role: true,
      },
    });

    if (!user?.companyId) {
      throw new NotFoundException('User company not found');
    }

    const okr = await this.prisma.oKR.findFirst({
      where: this.buildOkrScopeWhere(user.role, user.companyId, user.departmentId, okrId),
      include: this.okrInclude(),
    });

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    const oldCurrentValue = okr.currentValue;

    if (user.role === 'EMPLOYEE' && okr.responsibleId !== actor.sub) {
      throw new ForbiddenException('You can only update progress on OKRs assigned to you');
    }

    assertCycleIsEditable(
      okr.objective.cycle,
      'OKRs can only be changed while the strategic cycle is active',
    );
    const metricType = okr.metricType ?? OKRMetricType.NUMBER;
    const normalizedValue = normalizeOkrValue(input.value, metricType);
    validateOkrValues({
      metricType,
      currentValue: normalizedValue,
      targetValue: okr.targetValue,
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.progressOKR.create({
        data: {
          okrId: okr.id,
          value: normalizedValue,
          date: new Date(),
          comment: input.comment?.trim() || 'Atualização de progresso',
        },
      });

      return tx.oKR.update({
        where: { id: okr.id },
        data: {
          currentValue: normalizedValue,
        },
        include: this.okrInclude(),
      });
    });

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.OKR_PROGRESS_UPDATED,
      entity: AUDIT_ENTITIES.PROGRESS_OKR,
      entityId: okr.id,
      companyId: user.companyId,
      departmentId: updated.objective.cycle.departmentId,
      oldValue: {
        currentValue: oldCurrentValue,
      },
      newValue: {
        currentValue: updated.currentValue,
        latestProgress: updated.progress[0]
          ? {
              id: updated.progress[0].id,
              value: updated.progress[0].value,
              date: updated.progress[0].date.toISOString(),
              comment: updated.progress[0].comment,
            }
          : null,
      },
      metadata: {
        okrId: updated.id,
        metricType: updated.metricType,
      },
      requestContext,
    });

    return this.mapOkr(updated, actor.sub);
  }

  private buildListWhere(
    role: UserRole,
    companyId: string | null,
    departmentId: string | null,
    actorId: string,
    filters: ListOkrsDto,
  ): Prisma.OKRWhereInput {
    if (!companyId) {
      return { id: '__no-company__' };
    }

    const cycleScope: Prisma.StrategicCycleWhereInput = {
      department: {
        companyId,
      },
    };

    if (role === 'DIRECTOR') {
      if (filters.departmentId) {
        cycleScope.departmentId = filters.departmentId;
      }
    } else if (departmentId) {
      cycleScope.departmentId = departmentId;
    } else {
      return { id: '__no-department__' };
    }

    if (filters.cycleId) {
      cycleScope.id = filters.cycleId;
    }

    const objectiveScope: Prisma.ObjectiveWhereInput = {
      cycle: {
        is: cycleScope,
      },
    };

    if (filters.objectiveId) {
      objectiveScope.id = filters.objectiveId;
    }

    const where: Prisma.OKRWhereInput = {
      deletedAt: null,
      objective: {
        is: objectiveScope,
      },
    };

    if (filters.search?.trim()) {
      where.name = {
        contains: filters.search.trim(),
        mode: 'insensitive',
      };
    }

    if (filters.ownOnly === 'true') {
      where.responsibleId = actorId;
    } else if (filters.responsibleId) {
      where.responsibleId = filters.responsibleId;
    }

    return where;
  }

  private buildOkrScopeWhere(
    role: UserRole,
    companyId: string,
    departmentId: string | null,
    okrId: string,
  ): Prisma.OKRWhereInput {
    return {
      ...this.buildListWhere(role, companyId, departmentId, '__actor__', {}),
      id: okrId,
    };
  }

  private async getVisibleDepartments(
    role: UserRole,
    companyId: string | null,
    departmentId: string | null,
  ) {
    if (!companyId) {
      return [];
    }

    if (role === 'DIRECTOR') {
      return this.prisma.department.findMany({
        where: { companyId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
        },
      });
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

  private async getVisibleCycles(
    role: UserRole,
    companyId: string | null,
    departmentId: string | null,
  ): Promise<OkrCycleOption[]> {
    if (!companyId) {
      return [];
    }

    return this.prisma.strategicCycle
      .findMany({
        where: {
          department: {
            companyId,
          },
          ...(role === 'DIRECTOR'
            ? {}
            : departmentId
              ? { departmentId }
              : { id: '__no-department__' }),
        },
        orderBy: [{ endDate: 'desc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          status: true,
          endDate: true,
        },
      })
      .then((cycles) =>
        cycles.map((cycle) => ({
          id: cycle.id,
          name: cycle.name,
          cycleStatus: cycle.status,
          cycleEndDate: cycle.endDate.toISOString(),
          isCycleEditable: isCycleEditable(cycle),
        })),
      );
  }

  private async getVisibleObjectives(
    role: UserRole,
    companyId: string | null,
    departmentId: string | null,
  ): Promise<OkrObjectiveOption[]> {
    if (!companyId) {
      return [];
    }

    const cycleScope: Prisma.StrategicCycleWhereInput = {
      department: {
        companyId,
      },
    };

    if (role !== 'DIRECTOR') {
      if (!departmentId) {
        return [];
      }

      cycleScope.departmentId = departmentId;
    }

    return this.prisma.objective
      .findMany({
        where: {
          cycle: {
            is: cycleScope,
          },
        },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          cycleId: true,
          cycle: {
            select: {
              status: true,
              endDate: true,
            },
          },
        },
      })
      .then((objectives) =>
        objectives.map((objective) => ({
          id: objective.id,
          name: objective.name,
          cycleId: objective.cycleId,
          cycleStatus: objective.cycle.status,
          cycleEndDate: objective.cycle.endDate.toISOString(),
          isCycleEditable: isCycleEditable(objective.cycle),
        })),
      );
  }

  private async getVisibleResponsibles(
    role: UserRole,
    companyId: string | null,
    departmentId: string | null,
  ): Promise<OkrResponsibleOption[]> {
    if (!companyId) {
      return [];
    }

    return this.prisma.user
      .findMany({
        where: {
          companyId,
          departmentId: role === 'DIRECTOR' ? undefined : (departmentId ?? '__no-department__'),
        },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      })
      .then((users) =>
        users.map((user) => ({
          id: user.id,
          name: user.name,
          departmentName: user.department?.name ?? null,
        })),
      );
  }

  private async findObjectiveInScope(
    role: UserRole,
    companyId: string,
    departmentId: string | null,
    objectiveId: string,
  ) {
    const cycleScope: Prisma.StrategicCycleWhereInput = {
      department: {
        companyId,
      },
    };

    if (role !== 'DIRECTOR') {
      if (!departmentId) {
        throw new NotFoundException('Department not found');
      }

      cycleScope.departmentId = departmentId;
    }

    const objective = await this.prisma.objective.findFirst({
      where: {
        id: objectiveId,
        cycle: {
          is: cycleScope,
        },
      },
      include: {
        cycle: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            departmentId: true,
          },
        },
      },
    });

    if (!objective) {
      throw new NotFoundException('Objective not found');
    }

    return objective;
  }

  private async findResponsibleInScope(
    role: UserRole,
    companyId: string,
    departmentId: string | null,
    targetDepartmentId: string,
    responsibleId: string,
  ) {
    const responsible = await this.prisma.user.findFirst({
      where: {
        id: responsibleId,
        companyId,
        ...(role === 'DIRECTOR'
          ? {}
          : departmentId
            ? { departmentId }
            : { id: '__no-department__' }),
      },
      select: {
        id: true,
        departmentId: true,
      },
    });

    if (!responsible) {
      throw new NotFoundException('Responsible user not found');
    }

    if (responsible.departmentId !== targetDepartmentId) {
      throw new ForbiddenException('Responsible user must belong to the same department');
    }

    return responsible;
  }

  private matchesStatus(status: OkrStatus, filter?: ListOkrsDto['status']) {
    if (!filter) {
      return true;
    }

    return status === filter;
  }

  private buildKpis(okrs: OkrItem[]) {
    return {
      totalOkrs: okrs.length,
      completedOkrs: okrs.filter((okr) => okr.status === 'COMPLETED').length,
      activeOkrs: okrs.filter((okr) => okr.status === 'IN_PROGRESS').length,
      atRiskOkrs: okrs.filter((okr) => okr.status === 'AT_RISK').length,
      averageProgress: this.dashboardDomainService.calculateAverageProgress(
        okrs.map((okr) => okr.progress),
      ),
      ownOkrs: okrs.filter((okr) => okr.isOwnedByCurrentUser).length,
    };
  }

  private mapOkr(okr: OkrRecord, actorId: string): OkrItem {
    const metricType = okr.metricType ?? OKRMetricType.NUMBER;
    const currentValue = normalizeOkrValue(okr.currentValue, metricType);
    const targetValue = normalizeOkrValue(okr.targetValue, metricType);
    const progress = this.dashboardDomainService.calculateProgress(currentValue, targetValue);
    const lastUpdatedAt = okr.progress[0]?.date ?? okr.updatedAt;

    return {
      id: okr.id,
      name: okr.name,
      objectiveId: okr.objectiveId,
      objectiveName: okr.objective.name,
      cycleId: okr.objective.cycleId,
      cycleName: okr.objective.cycle.name,
      cycleStatus: okr.objective.cycle.status,
      cycleEndDate: okr.objective.cycle.endDate.toISOString(),
      isCycleEditable: isCycleEditable(okr.objective.cycle),
      departmentId: okr.objective.cycle.department.id,
      departmentName: okr.objective.cycle.department.name,
      responsibleId: okr.responsibleId,
      responsibleName: okr.responsible.name,
      metricType,
      currentValue,
      targetValue,
      progress,
      status: this.resolveStatus({
        progress,
        cycleStatus: okr.objective.cycle.status,
        cycleEndDate: okr.objective.cycle.endDate,
      }),
      lastUpdatedAt: lastUpdatedAt.toISOString(),
      isOwnedByCurrentUser: okr.responsibleId === actorId,
      progressHistory: okr.progress.map((progressItem) => ({
        id: progressItem.id,
        value: normalizeOkrValue(progressItem.value, metricType),
        date: progressItem.date.toISOString(),
        comment: progressItem.comment,
      })),
    };
  }

  private resolveStatus(input: {
    progress: number;
    cycleStatus: CycleStatus;
    cycleEndDate: Date;
  }): OkrStatus {
    if (input.progress >= 100) {
      return 'COMPLETED';
    }

    if (
      input.progress < 40 ||
      input.cycleStatus === CycleStatus.CLOSED ||
      input.cycleEndDate.getTime() < Date.now()
    ) {
      return 'AT_RISK';
    }

    return 'IN_PROGRESS';
  }

  private okrInclude() {
    return {
      responsible: {
        select: {
          id: true,
          name: true,
          departmentId: true,
        },
      },
      objective: {
        select: {
          id: true,
          name: true,
          cycleId: true,
          cycle: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
              departmentId: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      progress: {
        orderBy: { date: 'desc' },
        select: {
          id: true,
          value: true,
          date: true,
          comment: true,
        },
      },
    } satisfies Prisma.OKRInclude;
  }

  private toOkrAuditPayload(okr: OkrRecord) {
    return {
      id: okr.id,
      name: okr.name,
      metricType: okr.metricType,
      objectiveId: okr.objectiveId,
      responsibleId: okr.responsibleId,
      currentValue: okr.currentValue,
      targetValue: okr.targetValue,
      departmentId: okr.objective.cycle.departmentId,
      deletedAt:
        'deletedAt' in okr
          ? ((okr as { deletedAt?: Date | null }).deletedAt?.toISOString() ?? null)
          : null,
    };
  }
}
