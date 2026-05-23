import type {
  DashboardContext,
  DashboardPermission,
  DashboardRole,
  DashboardScope,
} from "../../dashboard/dashboard.types";

export type StrategicCycleStatus = "ACTIVE" | "CLOSED" | "DELAYED";

export type StrategicCycleItem = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  status: StrategicCycleStatus;
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

export type StrategicCycleDepartmentOption = {
  id: string;
  name: string;
};

export type StrategicCyclesResponse = {
  scope: DashboardScope;
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  filters: {
    departments: StrategicCycleDepartmentOption[];
  };
  kpis: StrategicCyclesKpis;
  cycles: StrategicCycleItem[];
};

export type StrategicCyclesFilters = {
  search: string;
  departmentId: string;
  status: "" | StrategicCycleStatus;
  startDate: string;
  endDate: string;
};

export type StrategicCyclePayload = {
  name: string;
  departmentId: string;
  startDate: string;
  endDate: string;
};
