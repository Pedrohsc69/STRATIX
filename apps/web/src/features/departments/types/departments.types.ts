import type {
  DashboardContext,
  DashboardPermission,
  DashboardRole,
  DashboardScope,
} from "../../dashboard/dashboard.types";

export type DepartmentStatus = "ON_TRACK" | "ATTENTION" | "AT_RISK" | "NO_DATA";

export type DepartmentManager = {
  id: string;
  name: string;
  email: string;
};

export type DepartmentManagerOption = DepartmentManager;

export type DepartmentCollaboratorOption = {
  id: string;
  name: string;
  email: string;
};

export type DepartmentCollaboratorItem = {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "ACTIVE" | "DISABLED";
};

export type DepartmentCycleReference = {
  id: string;
  name: string;
  status: "ACTIVE" | "CLOSED";
  progress: number;
  objectivesCount: number;
  okrsCount: number;
};

export type DepartmentObjectiveReference = {
  id: string;
  name: string;
  cycleId: string;
  cycleName: string;
  progress: number;
  okrsCount: number;
};

export type DepartmentOkrReference = {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
  responsibleName: string;
  progress: number;
};

export type DepartmentListItem = {
  id: string;
  name: string;
  manager: DepartmentManager | null;
  collaboratorsCount: number;
  cyclesCount: number;
  objectivesCount: number;
  okrsCount: number;
  averageProgress: number;
  status: DepartmentStatus;
};

export type DepartmentDetailsItem = DepartmentListItem & {
  collaborators: DepartmentCollaboratorItem[];
  cycles: DepartmentCycleReference[];
  objectives: DepartmentObjectiveReference[];
  okrs: DepartmentOkrReference[];
};

export type DepartmentsKpis = {
  totalDepartments: number;
  totalManagers: number;
  totalCollaborators: number;
  totalCycles: number;
  totalObjectives: number;
  totalOkrs: number;
  averageProgress: number;
};

export type DepartmentsResponse = {
  scope: DashboardScope;
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  filters: {
    managers: DepartmentManagerOption[];
  };
  form: {
    availableManagers: DepartmentManagerOption[];
    availableCollaborators: DepartmentCollaboratorOption[];
  };
  kpis: DepartmentsKpis;
  departments: DepartmentListItem[];
};

export type DepartmentDetailsResponse = {
  scope: DashboardScope;
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  availableManagers: DepartmentManagerOption[];
  availableCollaborators: DepartmentCollaboratorOption[];
  department: DepartmentDetailsItem;
};

export type DepartmentsFilters = {
  search: string;
  managerId: string;
  status: "" | DepartmentStatus;
  sortBy: "name" | "manager" | "members" | "cycles" | "progress";
  sortOrder: "asc" | "desc";
};

export type DepartmentCreatePayload = {
  name: string;
  managerId?: string | null;
  collaboratorIds?: string[];
};

export type DepartmentUpdatePayload = {
  name: string;
  managerId?: string | null;
  collaboratorIds?: string[];
};
