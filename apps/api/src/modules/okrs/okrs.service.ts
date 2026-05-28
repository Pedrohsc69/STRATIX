import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CycleStatus, type Prisma, type UserRole } from '@prisma/client';
import { PrismaService } from '../../core/shared/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
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

type OkrRecord = {
  id: string;
  name: string;
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

  async create(actor: AuthenticatedUser, input: CreateOkrDto) {
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
    this.assertCycleWritable(objective.cycle);

    const responsible = await this.findResponsibleInScope(
      user.role,
      user.companyId,
      user.departmentId,
      objective.cycle.departmentId,
      input.responsibleId,
    );

    this.assertTargetValue(input.targetValue);

    const created = await this.prisma.oKR.create({
      data: {
        name: input.name.trim(),
        objectiveId: objective.id,
        responsibleId: responsible.id,
        currentValue: 0,
        targetValue: input.targetValue,
      },
      include: this.okrInclude(),
    });

    return this.mapOkr(created, actor.sub);
  }

  async update(actor: AuthenticatedUser, okrId: string, input: UpdateOkrDto) {
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

    this.assertCycleWritable(existing.objective.cycle);

    const targetObjective =
      input.objectiveId && input.objectiveId !== existing.objectiveId
        ? await this.findObjectiveInScope(
            user.role,
            user.companyId,
            user.departmentId,
            input.objectiveId,
          )
        : existing.objective;

    this.assertCycleWritable(targetObjective.cycle);

    const targetResponsibleId = input.responsibleId ?? existing.responsibleId;
    const responsible = await this.findResponsibleInScope(
      user.role,
      user.companyId,
      user.departmentId,
      targetObjective.cycle.departmentId,
      targetResponsibleId,
    );

    const targetValue = input.targetValue ?? existing.targetValue;
    this.assertTargetValue(targetValue);

    if (existing.currentValue > targetValue) {
      throw new BadRequestException('Target value cannot be lower than the current value');
    }

    const updated = await this.prisma.oKR.update({
      where: { id: okrId },
      data: {
        name: input.name?.trim() ?? existing.name,
        objectiveId: targetObjective.id,
        responsibleId: responsible.id,
        targetValue,
      },
      include: this.okrInclude(),
    });

    return this.mapOkr(updated, actor.sub);
  }

  async remove(actor: AuthenticatedUser, okrId: string) {
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
      include: {
        objective: {
          select: {
            cycle: {
              select: {
                status: true,
                endDate: true,
              },
            },
          },
        },
        progress: {
          select: { id: true },
        },
      },
    });

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    this.assertCycleWritable(okr.objective.cycle);

    if (okr.progress.length > 0) {
      throw new BadRequestException('OKR has progress history and cannot be deleted');
    }

    await this.prisma.oKR.update({
      where: { id: okrId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { success: true };
  }

  async addProgress(actor: AuthenticatedUser, okrId: string, input: AddOkrProgressDto) {
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

    if (user.role === 'EMPLOYEE' && okr.responsibleId !== actor.sub) {
      throw new ForbiddenException('You can only update progress on OKRs assigned to you');
    }

    this.assertCycleWritable(okr.objective.cycle);
    this.assertProgressValue(input.value, okr.targetValue);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.progressOKR.create({
        data: {
          okrId: okr.id,
          value: input.value,
          date: new Date(),
          comment: input.comment?.trim() || 'Atualização de progresso',
        },
      });

      return tx.oKR.update({
        where: { id: okr.id },
        data: {
          currentValue: input.value,
        },
        include: this.okrInclude(),
      });
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

    return this.prisma.strategicCycle.findMany({
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
      },
    });
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

    return this.prisma.objective.findMany({
      where: {
        cycle: {
          is: cycleScope,
        },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });
  }

  private async getVisibleResponsibles(
    role: UserRole,
    companyId: string | null,
    departmentId: string | null,
  ): Promise<OkrResponsibleOption[]> {
    if (!companyId) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        companyId,
        departmentId: role === 'DIRECTOR' ? undefined : departmentId ?? '__no-department__',
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
    }).then((users) =>
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

  private assertCycleWritable(cycle: { status: CycleStatus; endDate: Date }) {
    if (cycle.status !== CycleStatus.ACTIVE || cycle.endDate.getTime() < Date.now()) {
      throw new ForbiddenException('OKRs can only be changed while the strategic cycle is active');
    }
  }

  private assertTargetValue(targetValue: number) {
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      throw new BadRequestException('Target value must be greater than zero');
    }
  }

  private assertProgressValue(value: number, targetValue: number) {
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException('Progress value must be zero or greater');
    }

    if (value > targetValue) {
      throw new BadRequestException('Current value cannot exceed the target value');
    }
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
    const progress = this.dashboardDomainService.calculateProgress(
      okr.currentValue,
      okr.targetValue,
    );
    const lastUpdatedAt = okr.progress[0]?.date ?? okr.updatedAt;

    return {
      id: okr.id,
      name: okr.name,
      objectiveId: okr.objectiveId,
      objectiveName: okr.objective.name,
      cycleId: okr.objective.cycleId,
      cycleName: okr.objective.cycle.name,
      departmentId: okr.objective.cycle.department.id,
      departmentName: okr.objective.cycle.department.name,
      responsibleId: okr.responsibleId,
      responsibleName: okr.responsible.name,
      currentValue: okr.currentValue,
      targetValue: okr.targetValue,
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
        value: progressItem.value,
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
}
