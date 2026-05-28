import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../core/shared/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { ListDepartmentsDto } from './dto/list-departments.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import type {
  DepartmentCollaboratorItem,
  DepartmentCollaboratorOption,
  DepartmentDetailsItem,
  DepartmentDetailsResponse,
  DepartmentListItem,
  DepartmentManagerItem,
  DepartmentManagerOption,
  DepartmentObjectiveReference,
  DepartmentOkrReference,
  DepartmentsKpis,
  DepartmentsResponse,
  DepartmentViewStatus,
} from './departments.types';

const departmentWithRelations = Prisma.validator<Prisma.DepartmentDefaultArgs>()({
  include: {
    manager: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    users: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    },
    cycles: {
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        status: true,
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
    },
  },
});

type DepartmentRecord = Prisma.DepartmentGetPayload<typeof departmentWithRelations>;
type DepartmentContextUser = {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
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
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardDomainService: DashboardDomainService,
  ) {}

  async list(
    actor: AuthenticatedUser,
    filters: ListDepartmentsDto,
  ): Promise<DepartmentsResponse> {
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

    const departments = await this.prisma.department.findMany({
      where: this.buildListWhere(user.role, user.companyId, user.departmentId, filters),
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
      ...departmentWithRelations,
    });

    const departmentItems = departments
      .map((department) => this.mapDepartment(department))
      .filter((department) => this.matchesStatus(department, filters.status));

    const sortedDepartments = this.sortDepartments(
      departmentItems,
      filters.sortBy ?? 'name',
      filters.sortOrder ?? 'asc',
    );

    return {
      scope: this.dashboardDomainService.getScope(user.role),
      role: user.role,
      permissions: this.dashboardDomainService.getPermissions(user.role),
      context: this.buildContext(user),
      filters: {
        managers: this.extractAssignedManagers(sortedDepartments),
      },
      form: {
        availableManagers:
          user.role === UserRole.DIRECTOR
            ? await this.getAvailableManagers(user.companyId, null)
            : [],
        availableCollaborators:
          user.role === UserRole.DIRECTOR
            ? await this.getAvailableCollaborators(user.companyId, null)
            : [],
      },
      kpis: this.buildKpis(sortedDepartments),
      departments: sortedDepartments,
    };
  }

  async getById(
    actor: AuthenticatedUser,
    departmentId: string,
  ): Promise<DepartmentDetailsResponse> {
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

    const department = await this.prisma.department.findFirst({
      where: this.buildDepartmentScopeWhere(
        user.role,
        user.companyId,
        user.departmentId,
        departmentId,
      ),
      ...departmentWithRelations,
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return {
      scope: this.dashboardDomainService.getScope(user.role),
      role: user.role,
      permissions: this.dashboardDomainService.getPermissions(user.role),
      context: this.buildContext(user),
      availableManagers:
        user.role === UserRole.DIRECTOR
          ? await this.getAvailableManagers(user.companyId, department.id)
          : [],
      availableCollaborators:
        user.role === UserRole.DIRECTOR
          ? await this.getAvailableCollaborators(user.companyId, department.id)
          : [],
      department: this.mapDepartmentDetails(department),
    };
  }

  async create(actor: AuthenticatedUser, input: CreateDepartmentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      throw new BadRequestException('Company must be created first');
    }

    const companyId = user.companyId;
    const normalizedName = input.name.trim();

    if (normalizedName.length < 2) {
      throw new BadRequestException('Department name must contain at least 2 characters');
    }

    await this.assertDepartmentNameAvailable(companyId, normalizedName);

    const created = await this.prisma.$transaction(async (tx) => {
      const department = await tx.department.create({
        data: {
          name: normalizedName,
          companyId,
        },
      });

      await this.assignDepartmentMembers(tx, companyId, department.id, {
        managerId: input.managerId,
        collaboratorIds: input.collaboratorIds ?? [],
      });

      const createdDepartment = await tx.department.findUnique({
        where: { id: department.id },
        ...departmentWithRelations,
      });

      if (!createdDepartment) {
        throw new NotFoundException('Department not found');
      }

      return createdDepartment;
    });

    return this.mapDepartmentDetails(created);
  }

  async update(
    actor: AuthenticatedUser,
    departmentId: string,
    input: UpdateDepartmentDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      throw new BadRequestException('Company must be created first');
    }

    const companyId = user.companyId;
    const existing = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId,
      },
      ...departmentWithRelations,
    });

    if (!existing) {
      throw new NotFoundException('Department not found');
    }

    const nextName = input.name?.trim() ?? existing.name;

    if (nextName.length < 2) {
      throw new BadRequestException('Department name must contain at least 2 characters');
    }

    if (nextName !== existing.name) {
      await this.assertDepartmentNameAvailable(companyId, nextName, existing.id);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.department.update({
        where: { id: departmentId },
        data: {
          name: nextName,
          ...(Object.prototype.hasOwnProperty.call(input, 'managerId')
            ? { managerId: input.managerId ?? null }
            : {}),
        },
      });

      await this.assignDepartmentMembers(tx, companyId, departmentId, {
        managerId: Object.prototype.hasOwnProperty.call(input, 'managerId')
          ? input.managerId ?? null
          : undefined,
        collaboratorIds: input.collaboratorIds ?? [],
      });

      const updatedDepartment = await tx.department.findUnique({
        where: { id: departmentId },
        ...departmentWithRelations,
      });

      if (!updatedDepartment) {
        throw new NotFoundException('Department not found');
      }

      return updatedDepartment;
    });

    return this.mapDepartmentDetails(updated);
  }

  async remove(actor: AuthenticatedUser, departmentId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      throw new BadRequestException('Company must be created first');
    }

    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId: user.companyId,
      },
      include: {
        users: {
          select: { id: true },
        },
        invites: {
          select: { id: true },
        },
        cycles: {
          select: { id: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (department.users.length > 0) {
      throw new BadRequestException('Department has linked users and cannot be deleted');
    }

    if (department.cycles.length > 0) {
      throw new BadRequestException(
        'Department has linked strategic cycles and cannot be deleted',
      );
    }

    if (department.invites.length > 0) {
      throw new BadRequestException('Department has pending invites and cannot be deleted');
    }

    await this.prisma.department.delete({
      where: { id: departmentId },
    });

    return { success: true };
  }

  private buildListWhere(
    role: UserRole,
    companyId: string | null,
    departmentId: string | null,
    filters: ListDepartmentsDto,
  ): Prisma.DepartmentWhereInput {
    if (!companyId) {
      return { id: '__no-company__' };
    }

    const where: Prisma.DepartmentWhereInput = {
      companyId,
    };

    if (role !== UserRole.DIRECTOR) {
      where.id = departmentId ?? '__no-department__';
      return where;
    }

    if (filters.managerId) {
      where.managerId = filters.managerId;
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          manager: {
            is: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    return where;
  }

  private buildDepartmentScopeWhere(
    role: UserRole,
    companyId: string | null,
    currentDepartmentId: string | null,
    targetDepartmentId: string,
  ): Prisma.DepartmentWhereInput {
    if (!companyId) {
      return {
        id: '__no-company__',
      };
    }

    if (role === UserRole.DIRECTOR) {
      return {
        id: targetDepartmentId,
        companyId,
      };
    }

    return {
      companyId,
      id:
        currentDepartmentId && currentDepartmentId === targetDepartmentId
          ? currentDepartmentId
          : '__no-department__',
    };
  }

  private mapDepartment(department: DepartmentRecord): DepartmentListItem {
    const objectiveReferences = this.mapObjectives(department);
    const okrReferences = this.mapOkrs(department);
    const collaborators = this.getCollaborators(department);
    const averageProgress = this.calculateAverageProgress(okrReferences.map((okr) => okr.progress));

    return {
      id: department.id,
      name: department.name,
      manager: department.manager
        ? {
            id: department.manager.id,
            name: department.manager.name,
            email: department.manager.email,
          }
        : null,
      collaboratorsCount: collaborators.length,
      cyclesCount: department.cycles.length,
      objectivesCount: objectiveReferences.length,
      okrsCount: okrReferences.length,
      averageProgress,
      status: this.getDepartmentStatus(averageProgress, okrReferences.length),
    };
  }

  private mapDepartmentDetails(department: DepartmentRecord): DepartmentDetailsItem {
    const summary = this.mapDepartment(department);
    const objectives = this.mapObjectives(department);
    const okrs = this.mapOkrs(department);

    return {
      ...summary,
      collaborators: this.getCollaborators(department),
      cycles: department.cycles.map((cycle) => {
        const cycleOkrs = cycle.objectives.flatMap((objective) => objective.okrs);
        return {
          id: cycle.id,
          name: cycle.name,
          status: cycle.status,
          progress: this.calculateAverageProgress(
            cycleOkrs.map((okr) =>
              this.dashboardDomainService.calculateProgress(okr.currentValue, okr.targetValue),
            ),
          ),
          objectivesCount: cycle.objectives.length,
          okrsCount: cycleOkrs.length,
        };
      }),
      objectives,
      okrs,
    };
  }

  private getCollaborators(department: DepartmentRecord): DepartmentCollaboratorItem[] {
    return department.users
      .filter((user) => user.role === UserRole.EMPLOYEE)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      }));
  }

  private mapObjectives(department: DepartmentRecord): DepartmentObjectiveReference[] {
    return department.cycles.flatMap((cycle) =>
      cycle.objectives.map((objective) => ({
        id: objective.id,
        name: objective.name,
        cycleId: cycle.id,
        cycleName: cycle.name,
        progress: this.calculateAverageProgress(
          objective.okrs.map((okr) =>
            this.dashboardDomainService.calculateProgress(okr.currentValue, okr.targetValue),
          ),
        ),
        okrsCount: objective.okrs.length,
      })),
    );
  }

  private mapOkrs(department: DepartmentRecord): DepartmentOkrReference[] {
    return department.cycles.flatMap((cycle) =>
      cycle.objectives.flatMap((objective) =>
        objective.okrs.map((okr) => ({
          id: okr.id,
          name: okr.name,
          objectiveId: objective.id,
          objectiveName: objective.name,
          responsibleName: okr.responsible.name,
          progress: this.dashboardDomainService.calculateProgress(
            okr.currentValue,
            okr.targetValue,
          ),
        })),
      ),
    );
  }

  private getDepartmentStatus(
    averageProgress: number,
    okrsCount: number,
  ): DepartmentViewStatus {
    if (okrsCount === 0) {
      return 'NO_DATA';
    }

    const status = this.dashboardDomainService.classifyProgressStatus(averageProgress);

    if (status === 'on_track') {
      return 'ON_TRACK';
    }

    if (status === 'attention') {
      return 'ATTENTION';
    }

    return 'AT_RISK';
  }

  private buildKpis(departments: DepartmentListItem[]): DepartmentsKpis {
    const departmentsWithProgress = departments.filter((department) => department.okrsCount > 0);

    return {
      totalDepartments: departments.length,
      totalManagers: new Set(
        departments
          .map((department) => department.manager?.id ?? null)
          .filter((managerId): managerId is string => !!managerId),
      ).size,
      totalCollaborators: departments.reduce(
        (accumulator, department) => accumulator + department.collaboratorsCount,
        0,
      ),
      totalCycles: departments.reduce(
        (accumulator, department) => accumulator + department.cyclesCount,
        0,
      ),
      totalObjectives: departments.reduce(
        (accumulator, department) => accumulator + department.objectivesCount,
        0,
      ),
      totalOkrs: departments.reduce(
        (accumulator, department) => accumulator + department.okrsCount,
        0,
      ),
      averageProgress: this.calculateAverageProgress(
        departmentsWithProgress.map((department) => department.averageProgress),
      ),
    };
  }

  private extractAssignedManagers(departments: DepartmentListItem[]): DepartmentManagerOption[] {
    const managers = new Map<string, DepartmentManagerOption>();

    departments.forEach((department) => {
      if (department.manager) {
        managers.set(department.manager.id, department.manager);
      }
    });

    return [...managers.values()].sort((left, right) => left.name.localeCompare(right.name));
  }

  private matchesStatus(
    department: DepartmentListItem,
    status?: DepartmentViewStatus,
  ) {
    if (!status) {
      return true;
    }

    return department.status === status;
  }

  private sortDepartments(
    departments: DepartmentListItem[],
    sortBy: 'name' | 'manager' | 'members' | 'cycles' | 'progress',
    sortOrder: 'asc' | 'desc',
  ) {
    const direction = sortOrder === 'asc' ? 1 : -1;

    return [...departments].sort((left, right) => {
      switch (sortBy) {
        case 'manager':
          return (
            (left.manager?.name ?? 'Sem gestor').localeCompare(
              right.manager?.name ?? 'Sem gestor',
            ) * direction
          );
        case 'members':
          return (left.collaboratorsCount - right.collaboratorsCount) * direction;
        case 'cycles':
          return (left.cyclesCount - right.cyclesCount) * direction;
        case 'progress':
          return (left.averageProgress - right.averageProgress) * direction;
        case 'name':
        default:
          return left.name.localeCompare(right.name) * direction;
      }
    });
  }

  private calculateAverageProgress(progresses: number[]) {
    return this.dashboardDomainService.calculateAverageProgress(progresses);
  }

  private async assertDepartmentNameAvailable(
    companyId: string,
    name: string,
    ignoreDepartmentId?: string,
  ) {
    const existingDepartment = await this.prisma.department.findFirst({
      where: {
        companyId,
        name,
        ...(ignoreDepartmentId ? { id: { not: ignoreDepartmentId } } : {}),
      },
      select: { id: true },
    });

    if (existingDepartment) {
      throw new ConflictException('Department already exists');
    }
  }

  private async assignDepartmentMembers(
    tx: Prisma.TransactionClient,
    companyId: string,
    departmentId: string,
    input: {
      managerId?: string | null;
      collaboratorIds: string[];
    },
  ) {
    if (input.collaboratorIds.length > 0) {
      const collaborators = await tx.user.findMany({
        where: {
          id: { in: input.collaboratorIds },
          companyId,
          role: UserRole.EMPLOYEE,
        },
        select: {
          id: true,
          departmentId: true,
        },
      });

      if (collaborators.length !== input.collaboratorIds.length) {
        throw new NotFoundException('Collaborator not found');
      }

      const invalidCollaborator = collaborators.find(
        (collaborator) => collaborator.departmentId === departmentId,
      );

      if (invalidCollaborator) {
        throw new BadRequestException('Collaborator is already linked to this department');
      }

      await tx.user.updateMany({
        where: {
          id: { in: input.collaboratorIds },
        },
        data: {
          departmentId,
        },
      });
    }

    if (input.managerId === undefined) {
      return;
    }

    if (input.managerId === null) {
      return;
    }

    const manager = await tx.user.findFirst({
      where: {
        id: input.managerId,
        companyId,
        role: UserRole.MANAGER,
      },
      select: {
        id: true,
        departmentId: true,
        managedDepartments: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    const managesAnotherDepartment = manager.managedDepartments.some(
      (department) => department.id !== departmentId,
    );

    if (managesAnotherDepartment) {
      throw new ConflictException('Manager already leads another department');
    }

    await tx.user.update({
      where: { id: manager.id },
      data: {
        departmentId,
      },
    });

    await tx.department.update({
      where: { id: departmentId },
      data: {
        managerId: manager.id,
      },
    });
  }

  private async getAvailableManagers(
    companyId: string | null,
    currentDepartmentId: string | null,
  ): Promise<DepartmentManagerOption[]> {
    if (!companyId) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        companyId,
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        ...(currentDepartmentId
          ? {
              OR: [
                { managedDepartments: { none: {} } },
                { managedDepartments: { some: { id: currentDepartmentId } } },
              ],
            }
          : { managedDepartments: { none: {} } }),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  private async getAvailableCollaborators(
    companyId: string | null,
    currentDepartmentId: string | null,
  ): Promise<DepartmentCollaboratorOption[]> {
    if (!companyId) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        companyId,
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  private buildContext(user: DepartmentContextUser) {
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
