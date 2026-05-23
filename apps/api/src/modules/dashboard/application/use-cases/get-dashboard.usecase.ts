import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../../core/shared/prisma.service';
import type { AuthenticatedUser } from '../../../auth/auth.types';
import { DashboardDomainService } from '../../domain/services/dashboard-domain.service';
import type {
  DashboardResponse,
  DepartmentPerformanceItem,
  ObjectiveWidgetItem,
  OkrProgressWidgetItem,
  RecentUpdateWidgetItem,
  RiskAlertWidgetItem,
  StrategicCycleWidgetItem,
} from '../../dashboard.types';

@Injectable()
export class GetDashboardUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domainService: DashboardDomainService,
  ) {}

  async execute(actor: AuthenticatedUser): Promise<DashboardResponse> {
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

    if (user.role === 'DIRECTOR' && user.companyId) {
      return this.buildCompanyDashboard({
        actorId: user.id,
        role: user.role,
        companyId: user.companyId,
      });
    }

    if (user.role === 'MANAGER' && user.companyId && user.departmentId) {
      return this.buildDepartmentDashboard({
        actorId: user.id,
        role: user.role,
        companyId: user.companyId,
        departmentId: user.departmentId,
      });
    }

    if (user.role === 'EMPLOYEE' && user.companyId && user.departmentId) {
      return this.buildDepartmentDashboard({
        actorId: user.id,
        role: user.role,
        companyId: user.companyId,
        departmentId: user.departmentId,
      });
    }

    return {
      scope: this.domainService.getScope(user.role),
      role: user.role,
      permissions: this.domainService.getPermissions(user.role),
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
      kpis: {
        totalDepartments: 0,
        totalEmployees: 0,
        totalManagers: 0,
        totalCollaborators: 0,
        totalStrategicCycles: 0,
        activeStrategicCycles: 0,
        totalObjectives: 0,
        totalOkrs: 0,
        ownOkrs: 0,
        atRiskOkrs: 0,
        completionRate: 0,
      },
      widgets: {
        executiveOverview: null,
        departmentOverview: null,
        strategicCycles: [],
        objectives: [],
        okrProgress: [],
        teamMembers: [],
        riskAlerts: [],
        recentUpdates: [],
      },
    };
  }

  private async buildCompanyDashboard(input: {
    actorId: string;
    role: UserRole;
    companyId: string;
  }): Promise<DashboardResponse> {
    const [company, departments, users] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: input.companyId },
      }),
      this.prisma.department.findMany({
        where: { companyId: input.companyId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              role: true,
              status: true,
              departmentId: true,
              updatedAt: true,
            },
          },
          cycles: {
            include: {
              objectives: {
                include: {
                  okrs: {
                    where: { deletedAt: null },
                    include: {
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
      }),
      this.prisma.user.findMany({
        where: { companyId: input.companyId },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const aggregated = this.aggregateDepartmentData(departments, input.actorId);

    return {
      scope: this.domainService.getScope(input.role),
      role: input.role,
      permissions: this.domainService.getPermissions(input.role),
      context: {
        company: {
          id: company.id,
          name: company.name,
          businessArea: company.businessArea,
        },
        department: null,
        user: this.buildUserContext(users.find((user) => user.id === input.actorId)),
      },
      kpis: {
        totalDepartments: departments.length,
        totalEmployees: users.length,
        totalManagers: users.filter((user) => user.role === 'MANAGER').length,
        totalCollaborators: users.filter((user) => user.role === 'EMPLOYEE').length,
        totalStrategicCycles: aggregated.cycles.length,
        activeStrategicCycles: aggregated.cycles.filter((cycle) => cycle.status === 'ACTIVE').length,
        totalObjectives: aggregated.objectives.length,
        totalOkrs: aggregated.okrs.length,
        ownOkrs: aggregated.okrs.filter((okr) => okr.isOwnedByCurrentUser).length,
        atRiskOkrs: aggregated.okrs.filter((okr) => okr.progress < 50).length,
        completionRate: this.domainService.calculateAverageProgress(
          aggregated.okrs.map((okr) => okr.progress),
        ),
      },
      widgets: {
        executiveOverview: {
          departmentPerformance: this.buildDepartmentPerformance(departments),
          quickActions: this.domainService.getQuickActions(input.role),
        },
        departmentOverview: null,
        strategicCycles: aggregated.cycles.slice(0, 6),
        objectives: aggregated.objectives.slice(0, 6),
        okrProgress: aggregated.okrs.slice(0, 8),
        teamMembers: users
          .slice()
          .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
          .slice(0, 8)
          .map((user) => ({
            id: user.id,
            name: user.name,
            role: user.role,
            status: user.status,
            departmentName: user.department?.name ?? null,
          })),
        riskAlerts: aggregated.riskAlerts.slice(0, 6),
        recentUpdates: aggregated.recentUpdates.slice(0, 8),
      },
    };
  }

  private async buildDepartmentDashboard(input: {
    actorId: string;
    role: UserRole;
    companyId: string;
    departmentId: string;
  }): Promise<DashboardResponse> {
    const [company, department] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: input.companyId },
      }),
      this.prisma.department.findFirst({
        where: {
          id: input.departmentId,
          companyId: input.companyId,
        },
        include: {
          users: true,
          cycles: {
            include: {
              objectives: {
                include: {
                  okrs: {
                    where: { deletedAt: null },
                    include: {
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
      }),
    ]);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const aggregated = this.aggregateDepartmentData([department], input.actorId);
    const employeeDistribution = [
      {
        label: 'Gestores',
        value: department.users.filter((user) => user.role === 'MANAGER').length,
      },
      {
        label: 'Colaboradores',
        value: department.users.filter((user) => user.role === 'EMPLOYEE').length,
      },
      {
        label: 'Diretores',
        value: department.users.filter((user) => user.role === 'DIRECTOR').length,
      },
    ].filter((item) => item.value > 0);

    const okrProgress =
      input.role === 'EMPLOYEE'
        ? aggregated.okrs.filter((okr) => okr.isOwnedByCurrentUser)
        : aggregated.okrs;

    const riskAlerts =
      input.role === 'EMPLOYEE'
        ? aggregated.riskAlerts.filter((alert) =>
            aggregated.okrs.some((okr) => okr.id === alert.id && okr.isOwnedByCurrentUser),
          )
        : aggregated.riskAlerts;

    return {
      scope: this.domainService.getScope(input.role),
      role: input.role,
      permissions: this.domainService.getPermissions(input.role),
      context: {
        company: company
          ? {
              id: company.id,
              name: company.name,
              businessArea: company.businessArea,
            }
          : null,
        department: {
          id: department.id,
          name: department.name,
        },
        user: this.buildUserContext(department.users.find((user) => user.id === input.actorId)),
      },
      kpis: {
        totalDepartments: 1,
        totalEmployees: department.users.length,
        totalManagers: department.users.filter((user) => user.role === 'MANAGER').length,
        totalCollaborators: department.users.filter((user) => user.role === 'EMPLOYEE').length,
        totalStrategicCycles: aggregated.cycles.length,
        activeStrategicCycles: aggregated.cycles.filter((cycle) => cycle.status === 'ACTIVE').length,
        totalObjectives: aggregated.objectives.length,
        totalOkrs: aggregated.okrs.length,
        ownOkrs: aggregated.okrs.filter((okr) => okr.isOwnedByCurrentUser).length,
        atRiskOkrs: aggregated.okrs.filter((okr) => okr.progress < 50).length,
        completionRate: this.domainService.calculateAverageProgress(
          aggregated.okrs.map((okr) => okr.progress),
        ),
      },
      widgets: {
        executiveOverview: null,
        departmentOverview: {
          departmentName: department.name,
          employeeDistribution,
          quickActions: this.domainService.getQuickActions(input.role),
        },
        strategicCycles: aggregated.cycles.slice(0, 6),
        objectives: aggregated.objectives.slice(0, 6),
        okrProgress: okrProgress.slice(0, 8),
        teamMembers:
          input.role === 'EMPLOYEE'
            ? []
            : department.users.slice(0, 8).map((user) => ({
                id: user.id,
                name: user.name,
                role: user.role,
                status: user.status,
                departmentName: department.name,
              })),
        riskAlerts: riskAlerts.slice(0, 6),
        recentUpdates:
          input.role === 'EMPLOYEE'
            ? aggregated.recentUpdates
                .filter((update) => update.type !== 'okr' || okrProgress.some((okr) => okr.id === update.id))
                .slice(0, 8)
            : aggregated.recentUpdates.slice(0, 8),
      },
    };
  }

  private aggregateDepartmentData(
    departments: Array<{
      id: string;
      name: string;
      users: Array<{ id: string; name: string; role: UserRole; status: UserStatus }>;
      cycles: Array<{
        id: string;
        name: string;
        status: 'ACTIVE' | 'CLOSED';
        startDate: Date;
        endDate: Date;
        updatedAt: Date;
        objectives: Array<{
          id: string;
          name: string;
          updatedAt: Date;
          okrs: Array<{
            id: string;
            name: string;
            currentValue: number;
            targetValue: number;
            responsibleId: string;
            updatedAt: Date;
            responsible: { id: string; name: string };
          }>;
        }>;
      }>;
    }>,
    actorId: string,
  ) {
    const cycles: StrategicCycleWidgetItem[] = [];
    const objectives: ObjectiveWidgetItem[] = [];
    const okrs: OkrProgressWidgetItem[] = [];
    const riskAlerts: RiskAlertWidgetItem[] = [];
    const recentUpdates: RecentUpdateWidgetItem[] = [];

    departments.forEach((department) => {
      department.cycles.forEach((cycle) => {
        const cycleOkrProgresses = cycle.objectives.flatMap((objective) =>
          objective.okrs.map((okr) =>
            this.domainService.calculateProgress(okr.currentValue, okr.targetValue),
          ),
        );

        cycles.push({
          id: cycle.id,
          name: cycle.name,
          departmentName: department.name,
          status: cycle.status,
          startDate: cycle.startDate.toISOString(),
          endDate: cycle.endDate.toISOString(),
          progress: this.domainService.calculateAverageProgress(cycleOkrProgresses),
        });

        recentUpdates.push({
          id: cycle.id,
          type: 'cycle',
          title: cycle.name,
          departmentName: department.name,
          updatedAt: cycle.updatedAt.toISOString(),
        });

        cycle.objectives.forEach((objective) => {
          const objectiveProgresses = objective.okrs.map((okr) =>
            this.domainService.calculateProgress(okr.currentValue, okr.targetValue),
          );
          const objectiveProgress = this.domainService.calculateAverageProgress(objectiveProgresses);

          objectives.push({
            id: objective.id,
            name: objective.name,
            departmentName: department.name,
            cycleName: cycle.name,
            progress: objectiveProgress,
            status: this.domainService.classifyProgressStatus(objectiveProgress),
          });

          recentUpdates.push({
            id: objective.id,
            type: 'objective',
            title: objective.name,
            departmentName: department.name,
            updatedAt: objective.updatedAt.toISOString(),
          });

          objective.okrs.forEach((okr) => {
            const progress = this.domainService.calculateProgress(
              okr.currentValue,
              okr.targetValue,
            );

            okrs.push({
              id: okr.id,
              name: okr.name,
              objectiveName: objective.name,
              departmentName: department.name,
              ownerName: okr.responsible.name,
              progress,
              currentValue: okr.currentValue,
              targetValue: okr.targetValue,
              isOwnedByCurrentUser: okr.responsibleId === actorId,
            });

            if (progress < 50) {
              riskAlerts.push({
                id: okr.id,
                name: okr.name,
                departmentName: department.name,
                ownerName: okr.responsible.name,
                progress,
                severity: progress < 25 ? 'high' : 'medium',
              });
            }

            recentUpdates.push({
              id: okr.id,
              type: 'okr',
              title: okr.name,
              departmentName: department.name,
              updatedAt: okr.updatedAt.toISOString(),
            });
          });
        });
      });
    });

    cycles.sort((left, right) => new Date(right.startDate).getTime() - new Date(left.startDate).getTime());
    objectives.sort((left, right) => right.progress - left.progress);
    okrs.sort((left, right) => right.progress - left.progress);
    riskAlerts.sort((left, right) => left.progress - right.progress);
    recentUpdates.sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );

    return {
      cycles,
      objectives,
      okrs,
      riskAlerts,
      recentUpdates,
    };
  }

  private buildDepartmentPerformance(
    departments: Array<{
      id: string;
      name: string;
      users: Array<{ id: string; role: UserRole }>;
      cycles: Array<{
        status: 'ACTIVE' | 'CLOSED';
        objectives: Array<{
          okrs: Array<{
            currentValue: number;
            targetValue: number;
          }>;
        }>;
      }>;
    }>,
  ): DepartmentPerformanceItem[] {
    return departments
      .map((department) => {
        const progressValues = department.cycles.flatMap((cycle) =>
          cycle.objectives.flatMap((objective) =>
            objective.okrs.map((okr) =>
              this.domainService.calculateProgress(okr.currentValue, okr.targetValue),
            ),
          ),
        );

        return {
          id: department.id,
          name: department.name,
          employees: department.users.length,
          activeCycles: department.cycles.filter((cycle) => cycle.status === 'ACTIVE').length,
          completionRate: this.domainService.calculateAverageProgress(progressValues),
        };
      })
      .sort((left, right) => right.completionRate - left.completionRate)
      .slice(0, 6);
  }

  private buildUserContext(
    user:
      | {
          id: string;
          name: string;
          role: UserRole;
          status: UserStatus;
        }
      | null
      | undefined,
  ) {
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  }
}
