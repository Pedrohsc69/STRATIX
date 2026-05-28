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
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { ListObjectivesDto } from './dto/list-objectives.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';
import type {
  ObjectiveCycleOption,
  ObjectiveItem,
  ObjectiveStatus,
  ObjectivesResponse,
} from './objectives.types';

type ObjectiveRecord = {
  id: string;
  name: string;
  description: string;
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
      manager: {
        id: string;
        name: string;
      } | null;
    };
  };
  okrs: Array<{
    id: string;
    currentValue: number;
    targetValue: number;
    responsible: {
      id: string;
      name: string;
    };
  }>;
};

@Injectable()
export class ObjectivesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardDomainService: DashboardDomainService,
  ) {}

  async list(
    actor: AuthenticatedUser,
    filters: ListObjectivesDto,
  ): Promise<ObjectivesResponse> {
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

    const [departments, cycles, objectives] = await Promise.all([
      this.getVisibleDepartments(user.role, user.companyId, user.departmentId),
      this.getVisibleCycles(user.role, user.companyId, user.departmentId),
      this.prisma.objective.findMany({
        where: this.buildListWhere(user.role, user.companyId, user.departmentId, filters),
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
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
                  manager: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          okrs: {
            where: { deletedAt: null },
            select: {
              id: true,
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
      }),
    ]);

    const objectiveItems = objectives
      .map((objective) => this.mapObjective(objective))
      .filter((objective) => this.matchesStatus(objective.status, filters.status));

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
        priorities: ['UNSPECIFIED'],
      },
      kpis: this.buildKpis(objectiveItems),
      objectives: objectiveItems,
    };
  }

  async create(actor: AuthenticatedUser, input: CreateObjectiveDto) {
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

    const cycle = await this.findCycleInScope(user.role, user.companyId, user.departmentId, input.cycleId);
    this.assertCycleWritable(cycle);

    const created = await this.prisma.objective.create({
      data: {
        name: input.name.trim(),
        description: input.description.trim(),
        cycleId: cycle.id,
      },
      include: this.objectiveInclude(),
    });

    return this.mapObjective(created);
  }

  async update(actor: AuthenticatedUser, objectiveId: string, input: UpdateObjectiveDto) {
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

    const existing = await this.prisma.objective.findFirst({
      where: this.buildObjectiveScopeWhere(user.role, user.companyId, user.departmentId, objectiveId),
      include: this.objectiveInclude(),
    });

    if (!existing) {
      throw new NotFoundException('Objective not found');
    }

    const targetCycle =
      input.cycleId && input.cycleId !== existing.cycleId
        ? await this.findCycleInScope(user.role, user.companyId, user.departmentId, input.cycleId)
        : existing.cycle;

    this.assertCycleWritable(targetCycle);

    const updated = await this.prisma.objective.update({
      where: { id: objectiveId },
      data: {
        name: input.name?.trim() ?? existing.name,
        description: input.description?.trim() ?? existing.description,
        cycleId: targetCycle.id,
      },
      include: this.objectiveInclude(),
    });

    return this.mapObjective(updated);
  }

  async remove(actor: AuthenticatedUser, objectiveId: string) {
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

    const objective = await this.prisma.objective.findFirst({
      where: this.buildObjectiveScopeWhere(user.role, user.companyId, user.departmentId, objectiveId),
      include: {
        okrs: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    if (!objective) {
      throw new NotFoundException('Objective not found');
    }

    if (objective.okrs.length > 0) {
      throw new BadRequestException('Objective has linked OKRs and cannot be deleted');
    }

    await this.prisma.objective.delete({
      where: { id: objectiveId },
    });

    return { success: true };
  }

  private buildListWhere(
    role: UserRole,
    companyId: string | null,
    departmentId: string | null,
    filters: ListObjectivesDto,
  ): Prisma.ObjectiveWhereInput {
    if (!companyId) {
      return { id: '__no-company__' };
    }

    const cycleScope: Prisma.StrategicCycleWhereInput = {
      department: {
        companyId,
      },
    };

    const where: Prisma.ObjectiveWhereInput = {
      cycle: {
        is: cycleScope,
      },
    };

    if (role === 'DIRECTOR') {
      if (filters.departmentId) {
        cycleScope.departmentId = filters.departmentId;
      }
    } else if (departmentId) {
      cycleScope.departmentId = departmentId;
    } else {
      where.id = '__no-department__';
    }

    if (filters.search?.trim()) {
      where.name = {
        contains: filters.search.trim(),
        mode: 'insensitive',
      };
    }

    if (filters.cycleId) {
      where.cycleId = filters.cycleId;
    }

    return where;
  }

  private buildObjectiveScopeWhere(
    role: UserRole,
    companyId: string,
    departmentId: string | null,
    objectiveId: string,
  ): Prisma.ObjectiveWhereInput {
    const where = this.buildListWhere(role, companyId, departmentId, {});
    return {
      ...where,
      id: objectiveId,
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
  ): Promise<ObjectiveCycleOption[]> {
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

  private async findCycleInScope(
    role: UserRole,
    companyId: string,
    departmentId: string | null,
    cycleId: string,
  ) {
    const cycle = await this.prisma.strategicCycle.findFirst({
      where: {
        id: cycleId,
        department: {
          companyId,
        },
        ...(role === 'DIRECTOR'
          ? {}
          : departmentId
          ? { departmentId }
          : { id: '__no-department__' }),
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            manager: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException('Strategic cycle not found');
    }

    return cycle;
  }

  private assertCycleWritable(cycle: {
    status: CycleStatus;
    endDate: Date;
  }) {
    if (cycle.status !== CycleStatus.ACTIVE || cycle.endDate.getTime() < Date.now()) {
      throw new ForbiddenException('Objective can only be linked to an active strategic cycle');
    }
  }

  private matchesStatus(status: ObjectiveStatus, filter?: ListObjectivesDto['status']) {
    if (!filter) {
      return true;
    }

    return status === filter;
  }

  private buildKpis(objectives: ObjectiveItem[]) {
    const totalObjectives = objectives.length;
    const activeObjectives = objectives.filter((objective) => objective.status === 'IN_PROGRESS').length;
    const completedObjectives = objectives.filter((objective) => objective.status === 'COMPLETED').length;
    const atRiskObjectives = objectives.filter((objective) => objective.status === 'AT_RISK').length;
    const completionRate = this.dashboardDomainService.calculateAverageProgress(
      objectives.map((objective) => objective.progress),
    );

    return {
      totalObjectives,
      activeObjectives,
      completedObjectives,
      atRiskObjectives,
      completionRate,
    };
  }

  private mapObjective(objective: ObjectiveRecord): ObjectiveItem {
    const progressValues = objective.okrs.map((okr) =>
      this.dashboardDomainService.calculateProgress(okr.currentValue, okr.targetValue),
    );
    const progress = this.dashboardDomainService.calculateAverageProgress(progressValues);
    const ownerNames = Array.from(
      new Set([
        ...objective.okrs.map((okr) => okr.responsible.name),
        ...(objective.cycle.department.manager?.name
          ? [objective.cycle.department.manager.name]
          : []),
      ]),
    ).sort();

    return {
      id: objective.id,
      name: objective.name,
      description: objective.description,
      cycleId: objective.cycleId,
      cycleName: objective.cycle.name,
      departmentId: objective.cycle.department.id,
      departmentName: objective.cycle.department.name,
      status: this.resolveStatus({
        progress,
        cycleStatus: objective.cycle.status,
        cycleEndDate: objective.cycle.endDate,
      }),
      priority: 'UNSPECIFIED',
      progress,
      okrsCount: objective.okrs.length,
      ownerNames,
      period: {
        startDate: objective.cycle.startDate.toISOString(),
        endDate: objective.cycle.endDate.toISOString(),
      },
    };
  }

  private resolveStatus(input: {
    progress: number;
    cycleStatus: CycleStatus;
    cycleEndDate: Date;
  }): ObjectiveStatus {
    if (input.progress >= 100) {
      return 'COMPLETED';
    }

    if (input.cycleEndDate.getTime() < Date.now() || input.progress < 40 || input.cycleStatus === CycleStatus.CLOSED) {
      return 'AT_RISK';
    }

    return 'IN_PROGRESS';
  }

  private objectiveInclude() {
    return {
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
              manager: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      okrs: {
        where: { deletedAt: null },
        select: {
          id: true,
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
    } satisfies Prisma.ObjectiveInclude;
  }
}
