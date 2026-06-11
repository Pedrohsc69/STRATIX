import type {
  DashboardContext,
  DashboardPermission,
  DashboardRole,
  DashboardScope,
} from '../../dashboard/dashboard.types';

export type OkrStatus = 'IN_PROGRESS' | 'COMPLETED' | 'AT_RISK';
export type OkrMetricType = 'PERCENTAGE' | 'NUMBER' | 'CURRENCY' | 'BOOLEAN';
export type OkrCycleStatus = 'ACTIVE' | 'CLOSED';
export type OkrObjectivePriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNSPECIFIED';

export type OkrProgressHistoryItem = {
  id: string;
  value: number;
  date: string;
  comment: string;
  createdAt: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: DashboardRole | null;
};

export type PaginatedOkrProgressHistoryResponse = {
  items: OkrProgressHistoryItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OkrItem = {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
  cycleId: string;
  cycleName: string;
  cycleStatus: OkrCycleStatus;
  cycleEndDate: string;
  isCycleEditable: boolean;
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
  cycleStatus: OkrCycleStatus;
  cycleEndDate: string;
  isCycleEditable: boolean;
};

export type OkrObjectiveOption = {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  departmentName: string;
  cycleId: string;
  cycleName: string;
  cycleStatus: OkrCycleStatus;
  cycleEndDate: string;
  priority: OkrObjectivePriority;
  status: OkrStatus;
  updatedAt: string;
  isCycleEditable: boolean;
};

export type OkrResponsibleOption = {
  id: string;
  name: string;
  departmentId: string | null;
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
  status: '' | OkrStatus;
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

export type UpdateOkrPayload = {
  name: string;
  objectiveId: string;
  responsibleId: string;
  metricType: OkrMetricType;
  targetValue: number;
};

export type OkrProgressPayload = {
  value: number;
  comment: string;
};

export type OkrProgressHistoryFilters = {
  page?: number;
  limit?: number;
};
