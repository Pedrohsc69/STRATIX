import { Injectable } from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import type {
  DashboardPermission,
  DashboardScope,
  QuickActionWidgetItem,
} from '../../dashboard.types';

@Injectable()
export class DashboardDomainService {
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
        'settings:manage',
      ],
      MANAGER: [
        'dashboard:view:department',
        'users:view:department',
        'cycles:view:department',
        'objectives:manage:department',
        'okrs:manage:department',
      ],
      EMPLOYEE: [
        'dashboard:view:department:readonly',
        'cycles:view:department',
        'objectives:view:department',
        'okrs:update:own',
        'okrs:view:own',
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
    if (target <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
  }

  calculateAverageProgress(progresses: number[]) {
    if (progresses.length === 0) {
      return 0;
    }

    return Math.round(
      progresses.reduce((accumulator, value) => accumulator + value, 0) / progresses.length,
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
