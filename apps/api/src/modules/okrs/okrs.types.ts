import type { OKRMetricType, UserRole } from '@prisma/client';
import type {
  DashboardCompanyContext,
  DashboardDepartmentContext,
  DashboardPermission,
  DashboardScope,
  DashboardUserContext,
} from '../dashboard/dashboard.types';

export type OkrStatus = 'IN_PROGRESS' | 'COMPLETED' | 'AT_RISK';

export type OkrDepartmentOption = {
  id: string;
  name: string;
};

export type OkrCycleOption = {
  id: string;
  name: string;
};

export type OkrObjectiveOption = {
  id: string;
  name: string;
};

export type OkrResponsibleOption = {
  id: string;
  name: string;
  departmentName: string | null;
};

export type OkrProgressHistoryItem = {
  id: string;
  value: number;
  date: string;
  comment: string;
};

export type OkrItem = {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
  cycleId: string;
  cycleName: string;
  departmentId: string;
  departmentName: string;
  responsibleId: string;
  responsibleName: string;
  metricType: OKRMetricType;
  currentValue: number;
  targetValue: number;
  progress: number;
  status: OkrStatus;
  lastUpdatedAt: string;
  isOwnedByCurrentUser: boolean;
  progressHistory: OkrProgressHistoryItem[];
};

export type OkrsKpis = {
  totalOkrs: number;
  completedOkrs: number;
  activeOkrs: number;
  atRiskOkrs: number;
  averageProgress: number;
  ownOkrs: number;
};

export type OkrsResponse = {
  scope: DashboardScope;
  role: UserRole;
  permissions: DashboardPermission[];
  context: {
    company: DashboardCompanyContext | null;
    department: DashboardDepartmentContext | null;
    user: DashboardUserContext;
  };
  filters: {
    departments: OkrDepartmentOption[];
    cycles: OkrCycleOption[];
    objectives: OkrObjectiveOption[];
    responsibles: OkrResponsibleOption[];
  };
  kpis: OkrsKpis;
  okrs: OkrItem[];
};
