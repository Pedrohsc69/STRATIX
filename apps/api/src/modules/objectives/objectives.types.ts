import type { CycleStatus, UserRole } from '@prisma/client';
import type {
  DashboardCompanyContext,
  DashboardDepartmentContext,
  DashboardPermission,
  DashboardScope,
  DashboardUserContext,
} from '../dashboard/dashboard.types';

export type ObjectiveStatus = 'IN_PROGRESS' | 'COMPLETED' | 'AT_RISK';
export type ObjectivePriority = 'UNSPECIFIED';

export type ObjectiveDepartmentOption = {
  id: string;
  name: string;
};

export type ObjectiveCycleOption = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  cycleStatus: CycleStatus;
  cycleStartDate: string;
  cycleEndDate: string;
  isCycleEditable: boolean;
};

export type ObjectiveItem = {
  id: string;
  name: string;
  description: string;
  cycleId: string;
  cycleName: string;
  cycleStatus: CycleStatus;
  cycleEndDate: string;
  isCycleEditable: boolean;
  departmentId: string;
  departmentName: string;
  status: ObjectiveStatus;
  priority: ObjectivePriority;
  progress: number;
  okrsCount: number;
  ownerNames: string[];
  period: {
    startDate: string;
    endDate: string;
  };
};

export type ObjectivesKpis = {
  totalObjectives: number;
  activeObjectives: number;
  completedObjectives: number;
  atRiskObjectives: number;
  completionRate: number;
};

export type ObjectivesResponse = {
  scope: DashboardScope;
  role: UserRole;
  permissions: DashboardPermission[];
  context: {
    company: DashboardCompanyContext | null;
    department: DashboardDepartmentContext | null;
    user: DashboardUserContext;
  };
  filters: {
    departments: ObjectiveDepartmentOption[];
    cycles: ObjectiveCycleOption[];
    priorities: ObjectivePriority[];
  };
  kpis: ObjectivesKpis;
  objectives: ObjectiveItem[];
};
