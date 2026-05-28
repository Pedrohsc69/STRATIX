import type {
  DashboardContext,
  DashboardPermission,
  DashboardRole,
  DashboardScope,
} from "../../dashboard/dashboard.types";

export type OkrStatus = "IN_PROGRESS" | "COMPLETED" | "AT_RISK";
export type OkrMetricType = "PERCENTAGE" | "NUMBER" | "CURRENCY" | "BOOLEAN";

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
  metricType: OkrMetricType;
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

export type OkrsResponse = {
  scope: DashboardScope;
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  filters: {
    departments: OkrDepartmentOption[];
    cycles: OkrCycleOption[];
    objectives: OkrObjectiveOption[];
    responsibles: OkrResponsibleOption[];
  };
  kpis: OkrsKpis;
  okrs: OkrItem[];
};

export type OkrsFilters = {
  search: string;
  departmentId: string;
  cycleId: string;
  objectiveId: string;
  responsibleId: string;
  status: "" | OkrStatus;
  ownOnly: boolean;
};

export type OkrPayload = {
  name: string;
  objectiveId: string;
  responsibleId: string;
  metricType: OkrMetricType;
  currentValue: number;
  targetValue: number;
};

export type OkrProgressPayload = {
  value: number;
  comment: string;
};
