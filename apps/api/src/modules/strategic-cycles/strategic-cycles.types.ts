import type { UserRole } from '@prisma/client';
import type {
  DashboardCompanyContext,
  DashboardDepartmentContext,
  DashboardPermission,
  DashboardScope,
  DashboardUserContext,
} from '../dashboard/dashboard.types';

export type StrategicCycleListStatus = 'ACTIVE' | 'CLOSED' | 'DELAYED';

export type StrategicCycleDepartmentOption = {
  id: string;
  name: string;
};

export type StrategicCycleListItem = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  status: StrategicCycleListStatus;
  startDate: string;
  endDate: string;
  progress: number;
  objectivesCount: number;
  okrsCount: number;
  objectiveNames: string[];
  ownerNames: string[];
};

export type StrategicCyclesKpis = {
  totalCycles: number;
  activeCycles: number;
  completedCycles: number;
  delayedCycles: number;
  completionRate: number;
};

export type StrategicCyclesResponse = {
  scope: DashboardScope;
  role: UserRole;
  permissions: DashboardPermission[];
  context: {
    company: DashboardCompanyContext | null;
    department: DashboardDepartmentContext | null;
    user: DashboardUserContext;
  };
  filters: {
    departments: StrategicCycleDepartmentOption[];
  };
  kpis: StrategicCyclesKpis;
  cycles: StrategicCycleListItem[];
};
