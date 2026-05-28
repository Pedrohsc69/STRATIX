import type {
  DashboardContext,
  DashboardPermission,
  DashboardRole,
  DashboardScope,
} from "../../dashboard/dashboard.types";

export type ObjectiveStatus = "IN_PROGRESS" | "COMPLETED" | "AT_RISK";
export type ObjectivePriority = "UNSPECIFIED";

export type ObjectiveItem = {
  id: string;
  name: string;
  description: string;
  cycleId: string;
  cycleName: string;
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

export type ObjectiveDepartmentOption = {
  id: string;
  name: string;
};

export type ObjectiveCycleOption = {
  id: string;
  name: string;
};

export type ObjectivesResponse = {
  scope: DashboardScope;
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  filters: {
    departments: ObjectiveDepartmentOption[];
    cycles: ObjectiveCycleOption[];
    priorities: ObjectivePriority[];
  };
  kpis: ObjectivesKpis;
  objectives: ObjectiveItem[];
};

export type ObjectivesFilters = {
  search: string;
  departmentId: string;
  cycleId: string;
  status: "" | ObjectiveStatus;
  priority: "" | ObjectivePriority;
};

export type ObjectivePayload = {
  name: string;
  description: string;
  cycleId: string;
};
