import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../core/shared/prisma.service';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import type { AuditRequestContext } from '../audit/audit.types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { CloudinaryAvatarService } from './cloudinary-avatar.service';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import type {
  EmployeeDepartmentItem,
  EmployeeDetailsItem,
  EmployeeDetailsResponse,
  EmployeeListItem,
  EmployeeListStatus,
  EmployeesKpis,
  EmployeesResponse,
  ProfileResponse,
  ProfileStats,
} from './users.types';

const listUserSelection = Prisma.validator<Prisma.UserDefaultArgs>()({
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    department: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});

const detailUserSelection = Prisma.validator<Prisma.UserDefaultArgs>()({
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    department: {
      select: {
        id: true,
        name: true,
      },
    },
    _count: {
      select: {
        okrs: true,
      },
    },
  },
});

type ListUserRecord = Prisma.UserGetPayload<typeof listUserSelection>;
type DetailUserRecord = Prisma.UserGetPayload<typeof detailUserSelection>;
type UsersContextActor = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  companyId: string | null;
  departmentId: string | null;
  lastAccessAt: Date | null;
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
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardDomainService: DashboardDomainService,
    private readonly auditService: AuditService,
    @Optional() private readonly cloudinaryAvatarService?: CloudinaryAvatarService,
  ) {}

  async list(actor: AuthenticatedUser, filters: ListUsersDto): Promise<EmployeesResponse> {
    const user = await this.getActorContext(actor.sub);

    if (user.role === UserRole.EMPLOYEE) {
      throw new ForbiddenException('Access denied');
    }

    if (!user.companyId) {
      throw new BadRequestException('Company must be created first');
    }

    const [users, invites, totalDepartmentOkrs, departments] = await Promise.all([
      this.prisma.user.findMany({
        where: this.buildUserListWhere(user.role, user.companyId, user.departmentId, filters),
        orderBy: [{ createdAt: 'desc' }],
        ...listUserSelection,
      }),
      user.role === UserRole.DIRECTOR
        ? this.prisma.invite.findMany({
            where: this.buildInviteWhere(user.companyId, filters),
            select: {
              id: true,
              email: true,
              role: true,
              expiresAt: true,
              createdAt: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: [{ createdAt: 'desc' }],
          })
        : Promise.resolve([]),
      user.role === UserRole.MANAGER && user.departmentId
        ? this.prisma.oKR.count({
            where: {
              deletedAt: null,
              objective: {
                cycle: {
                  departmentId: user.departmentId,
                },
              },
            },
          })
        : Promise.resolve(0),
      this.prisma.department.findMany({
        where:
          user.role === UserRole.DIRECTOR
            ? { companyId: user.companyId }
            : { companyId: user.companyId, id: user.departmentId ?? '__no-department__' },
        select: {
          id: true,
          name: true,
        },
        orderBy: [{ name: 'asc' }],
      }),
    ]);

    const employeeItems = this.sortEmployees(
      [
        ...users.map((employee) => this.mapUser(employee)),
        ...invites.map((invite) => this.mapInvite(invite)),
      ],
      filters.sortBy ?? 'name',
      filters.sortOrder ?? 'asc',
    );

    return {
      scope: this.dashboardDomainService.getScope(user.role),
      role: user.role,
      permissions: this.dashboardDomainService.getPermissions(user.role),
      context: this.buildContext(user),
      filters: {
        departments,
      },
      kpis: this.buildKpis(
        users,
        invites.filter((invite) => this.getInviteStatus(invite.expiresAt) === UserStatus.PENDING)
          .length,
        totalDepartmentOkrs,
      ),
      employees: employeeItems,
    };
  }

  async getById(
    actor: AuthenticatedUser,
    userId: string,
  ): Promise<EmployeeDetailsResponse> {
    const user = await this.getActorContext(actor.sub);

    if (user.role === UserRole.EMPLOYEE) {
      throw new ForbiddenException('Access denied');
    }

    if (!user.companyId) {
      throw new BadRequestException('Company must be created first');
    }

    const employee = await this.prisma.user.findFirst({
      where: this.buildUserScopeWhere(user.role, user.companyId, user.departmentId, userId),
      ...detailUserSelection,
    });

    if (!employee) {
      throw new NotFoundException('User not found');
    }

    return {
      scope: this.dashboardDomainService.getScope(user.role),
      role: user.role,
      permissions: this.dashboardDomainService.getPermissions(user.role),
      context: this.buildContext(user),
      employee: this.mapUserDetails(employee),
    };
  }

  async getMe(actor: AuthenticatedUser): Promise<ProfileResponse> {
    const user = await this.getActorContext(actor.sub);

    const manager =
      user.companyId && user.departmentId
        ? await this.prisma.department.findFirst({
            where: {
              id: user.departmentId,
              companyId: user.companyId,
            },
            select: {
              manager: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          })
        : null;

    const stats = await this.buildProfileStats(user);

    return {
      scope: this.dashboardDomainService.getScope(user.role),
      role: user.role,
      permissions: this.dashboardDomainService.getPermissions(user.role),
      context: this.buildContext(user),
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
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
        manager: manager?.manager ?? null,
      },
      stats,
      security: {
        canChangePassword: true,
        changePasswordPath: '/profile',
        lastAccessAt: user.lastAccessAt?.toISOString() ?? null,
        recoveryAvailable: true,
      },
    };
  }

  async updateMyAvatar(
    actor: AuthenticatedUser,
    input: UpdateAvatarDto,
    requestContext?: AuditRequestContext,
  ): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const nextAvatarUrl = input.avatarUrl.trim() || null;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        avatarUrl: nextAvatarUrl,
      },
    });

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.AVATAR_UPDATED,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      companyId: user.companyId ?? null,
      departmentId: user.departmentId ?? null,
      oldValue: {
        avatarUrl: user.avatarUrl,
      },
      newValue: {
        avatarUrl: nextAvatarUrl,
      },
      requestContext,
    });

    return this.getMe(actor);
  }

  async uploadMyAvatar(
    actor: AuthenticatedUser,
    file: Express.Multer.File | undefined,
    requestContext?: AuditRequestContext,
  ): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.assertValidAvatarFile(file);

    if (!this.cloudinaryAvatarService) {
      throw new BadRequestException('Avatar upload service is not available');
    }

    const nextAvatarUrl = await this.cloudinaryAvatarService.uploadAvatar(file, user.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        avatarUrl: nextAvatarUrl,
      },
    });

    await this.auditService.log({
      actor: {
        id: actor.sub,
        email: actor.email,
        role: actor.role,
      },
      action: AUDIT_ACTIONS.AVATAR_UPDATED,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      companyId: user.companyId ?? null,
      departmentId: user.departmentId ?? null,
      oldValue: {
        avatarUrl: user.avatarUrl,
      },
      newValue: {
        avatarUrl: nextAvatarUrl,
        source: 'upload',
      },
      requestContext,
    });

    return this.getMe(actor);
  }

  private assertValidAvatarFile(file: Express.Multer.File | undefined): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Avatar image file is required');
    }

    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Avatar image must be JPG, PNG or WEBP');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Avatar image must be up to 2MB');
    }
  }

  private async getActorContext(userId: string): Promise<UsersContextActor> {
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

    return user;
  }

  private buildUserListWhere(
    role: UserRole,
    companyId: string,
    departmentId: string | null,
    filters: ListUsersDto,
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      companyId,
    };

    if (role === UserRole.MANAGER) {
      where.departmentId = departmentId ?? '__no-department__';
    } else if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      if (filters.status === 'EXPIRED') {
        where.id = '__no-user__';
        return where;
      }

      where.status = filters.status;
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
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return where;
  }

  private buildInviteWhere(
    companyId: string,
    filters: ListUsersDto,
  ): Prisma.InviteWhereInput {
    if (filters.status === UserStatus.ACTIVE || filters.status === UserStatus.DISABLED) {
      return {
        id: '__no-invite__',
      };
    }

    const where: Prisma.InviteWhereInput = {
      companyId,
      accepted: false,
    };

    if (filters.status === UserStatus.PENDING) {
      where.expiresAt = {
        gt: new Date(),
      };
    }

    if (filters.status === 'EXPIRED') {
      where.expiresAt = {
        lte: new Date(),
      };
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          department: {
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

  private buildUserScopeWhere(
    role: UserRole,
    companyId: string,
    currentDepartmentId: string | null,
    targetUserId: string,
  ): Prisma.UserWhereInput {
    if (role === UserRole.DIRECTOR) {
      return {
        id: targetUserId,
        companyId,
      };
    }

    return {
      id: targetUserId,
      companyId,
      departmentId: currentDepartmentId ?? '__no-department__',
    };
  }

  private mapUser(employee: ListUserRecord): EmployeeListItem {
    return {
      id: employee.id,
      kind: 'USER',
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      status: employee.status,
      createdAt: employee.createdAt.toISOString(),
      joinedAt: employee.createdAt.toISOString(),
      expiresAt: null,
      canViewDetails: true,
      canResendInvite: false,
    };
  }

  private mapInvite(invite: {
    id: string;
    email: string;
    role: UserRole;
    expiresAt: Date;
    createdAt: Date;
    department: EmployeeDepartmentItem | null;
  }): EmployeeListItem {
    return {
      id: invite.id,
      kind: 'INVITE',
      name: null,
      email: invite.email,
      role: invite.role,
      department: invite.department,
      status: this.getInviteStatus(invite.expiresAt),
      createdAt: invite.createdAt.toISOString(),
      joinedAt: null,
      expiresAt: invite.expiresAt.toISOString(),
      canViewDetails: false,
      canResendInvite: true,
    };
  }

  private mapUserDetails(employee: DetailUserRecord): EmployeeDetailsItem {
    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      department: employee.department,
      createdAt: employee.createdAt.toISOString(),
      okrsCount: employee._count.okrs,
    };
  }

  private buildKpis(
    users: ListUserRecord[],
    pendingInvites: number,
    totalDepartmentOkrs: number,
  ): EmployeesKpis {
    return {
      totalEmployees: users.length,
      totalManagers: users.filter((employee) => employee.role === UserRole.MANAGER).length,
      totalCollaborators: users.filter((employee) => employee.role === UserRole.EMPLOYEE).length,
      pendingInvites,
      activeUsers: users.filter((employee) => employee.status === UserStatus.ACTIVE).length,
      totalDepartmentOkrs,
    };
  }

  private async buildProfileStats(user: UsersContextActor): Promise<ProfileStats> {
    const baseStats: ProfileStats = {
      companyName: user.company?.name ?? null,
      departmentName: user.department?.name ?? null,
      totalDepartments: 0,
      totalEmployees: 0,
      totalCycles: 0,
      totalDepartmentCollaborators: 0,
      totalDepartmentCycles: 0,
      totalDepartmentOkrs: 0,
      ownOkrs: 0,
      completedOwnOkrs: 0,
      averageOwnProgress: 0,
    };

    if (user.role === UserRole.DIRECTOR && user.companyId) {
      const [totalDepartments, totalEmployees, totalCycles] = await Promise.all([
        this.prisma.department.count({
          where: {
            companyId: user.companyId,
          },
        }),
        this.prisma.user.count({
          where: {
            companyId: user.companyId,
          },
        }),
        this.prisma.strategicCycle.count({
          where: {
            department: {
              companyId: user.companyId,
            },
          },
        }),
      ]);

      return {
        ...baseStats,
        totalDepartments,
        totalEmployees,
        totalCycles,
      };
    }

    if (user.role === UserRole.MANAGER && user.companyId && user.departmentId) {
      const [totalDepartmentCollaborators, totalDepartmentCycles, totalDepartmentOkrs] =
        await Promise.all([
          this.prisma.user.count({
            where: {
              companyId: user.companyId,
              departmentId: user.departmentId,
              role: UserRole.EMPLOYEE,
            },
          }),
          this.prisma.strategicCycle.count({
            where: {
              departmentId: user.departmentId,
              department: {
                companyId: user.companyId,
              },
            },
          }),
          this.prisma.oKR.count({
            where: {
              deletedAt: null,
              objective: {
                cycle: {
                  departmentId: user.departmentId,
                  department: {
                    companyId: user.companyId,
                  },
                },
              },
            },
          }),
        ]);

      return {
        ...baseStats,
        totalDepartmentCollaborators,
        totalDepartmentCycles,
        totalDepartmentOkrs,
      };
    }

    if (user.role === UserRole.EMPLOYEE && user.companyId) {
      const ownOkrs = await this.prisma.oKR.findMany({
        where: {
          deletedAt: null,
          responsibleId: user.id,
          responsible: {
            companyId: user.companyId,
          },
        },
        select: {
          currentValue: true,
          targetValue: true,
        },
      });

      const ownProgresses = ownOkrs.map((okr) =>
        this.dashboardDomainService.calculateProgress(okr.currentValue, okr.targetValue),
      );

      return {
        ...baseStats,
        ownOkrs: ownOkrs.length,
        completedOwnOkrs: ownProgresses.filter((progress) => progress >= 100).length,
        averageOwnProgress: this.dashboardDomainService.calculateAverageProgress(ownProgresses),
      };
    }

    return baseStats;
  }

  private sortEmployees(
    employees: EmployeeListItem[],
    sortBy: 'name' | 'department' | 'role' | 'date',
    sortOrder: 'asc' | 'desc',
  ) {
    const direction = sortOrder === 'asc' ? 1 : -1;

    return [...employees].sort((left, right) => {
      switch (sortBy) {
        case 'department':
          return (
            (left.department?.name ?? 'Sem departamento').localeCompare(
              right.department?.name ?? 'Sem departamento',
            ) * direction
          );
        case 'role':
          return left.role.localeCompare(right.role) * direction;
        case 'date':
          return (
            (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) *
            direction
          );
        case 'name':
        default:
          return ((left.name ?? left.email).localeCompare(right.name ?? right.email)) * direction;
      }
    });
  }

  private buildContext(user: UsersContextActor) {
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
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
      },
    };
  }

  private getInviteStatus(expiresAt: Date): EmployeeListStatus {
    return expiresAt.getTime() > Date.now() ? UserStatus.PENDING : 'EXPIRED';
  }
}
