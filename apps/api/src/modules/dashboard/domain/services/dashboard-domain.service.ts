import { Injectable } from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import type {
  DashboardPermission,
  DashboardScope,
  QuickActionWidgetItem,
} from '../../dashboard.types';

@Injectable()
export class DashboardDomainService {
  private roundTo(value: number, decimals: number) {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  getScope(role: UserRole): DashboardScope {
    if (role === 'DIRECTOR') {
      return 'COMPANY';
    }

    if (role === 'MANAGER') {
      return 'DEPARTMENT';
    }

    return 'EMPLOYEE';
  }

  getPermissions(role: UserRole): DashboardPermission[] {
    const permissionsByRole: Record<UserRole, DashboardPermission[]> = {
      DIRECTOR: [
        'dashboard:view:company',
        'departments:manage',
        'users:manage',
        'cycles:manage',
        'objectives:manage',
        'okrs:manage',
        'reports:export',
        'settings:view:self',
        'settings:manage:company',
      ],
      MANAGER: [
        'dashboard:view:department',
        'departments:view:department',
        'users:view:department',
        'cycles:view:department',
        'objectives:manage:department',
        'okrs:manage:department',
        'settings:view:self',
      ],
      EMPLOYEE: [
        'dashboard:view:department:readonly',
        'departments:view:department:readonly',
        'cycles:view:department',
        'objectives:view:department',
        'okrs:update:own',
        'okrs:view:own',
        'settings:view:self',
      ],
    };

    return permissionsByRole[role];
  }

  getQuickActions(role: UserRole): QuickActionWidgetItem[] {
    const quickActionsByRole: Record<UserRole, QuickActionWidgetItem[]> = {
      DIRECTOR: [
        { label: 'Novo departamento', path: '/departaments', permission: 'departments:manage' },
        { label: 'Novo ciclo', path: '/dashboard-cycles', permission: 'cycles:manage' },
        { label: 'Novo objetivo', path: '/objetivos', permission: 'objectives:manage' },
        { label: 'Convidar equipe', path: '/employees', permission: 'users:manage' },
      ],
      MANAGER: [
        { label: 'Ver ciclos', path: '/dashboard-cycles', permission: 'cycles:view:department' },
        { label: 'Gerenciar objetivos', path: '/objetivos', permission: 'objectives:manage:department' },
        { label: 'Acompanhar OKRs', path: '/okrs', permission: 'okrs:manage:department' },
      ],
      EMPLOYEE: [],
    };

    return quickActionsByRole[role];
  }

  calculateProgress(current: number, target: number) {
    if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, this.roundTo((current / target) * 100, 1)));
  }

  calculateAverageProgress(progresses: number[]) {
    const validProgresses = progresses.filter((value) => Number.isFinite(value));

    if (validProgresses.length === 0) {
      return 0;
    }

    return this.roundTo(
      validProgresses.reduce((accumulator, value) => accumulator + value, 0) /
        validProgresses.length,
      1,
    );
  }

  classifyProgressStatus(progress: number): 'on_track' | 'attention' | 'at_risk' {
    if (progress >= 70) {
      return 'on_track';
    }

    if (progress >= 40) {
      return 'attention';
    }

    return 'at_risk';
  }
}
