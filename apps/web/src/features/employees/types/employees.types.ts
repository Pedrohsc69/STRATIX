import type {
  DashboardContext,
  DashboardPermission,
  DashboardRole,
  DashboardScope,
} from "../../dashboard/dashboard.types";

export type EmployeeDirectoryKind = "USER" | "INVITE";
export type EmployeeStatus = "PENDING" | "ACTIVE" | "DISABLED" | "EXPIRED";

export type EmployeeDepartment = {
  id: string;
  name: string;
};

export type EmployeeListItem = {
  id: string;
  kind: EmployeeDirectoryKind;
  name: string | null;
  email: string;
  role: DashboardRole;
  department: EmployeeDepartment | null;
  status: EmployeeStatus;
  createdAt: string;
  joinedAt: string | null;
  expiresAt: string | null;
  canViewDetails: boolean;
  canResendInvite: boolean;
};

export type EmployeeDetailsItem = {
  id: string;
  name: string;
  email: string;
  role: DashboardRole;
  status: EmployeeStatus;
  department: EmployeeDepartment | null;
  createdAt: string;
  okrsCount: number;
};

export type EmployeesKpis = {
  totalEmployees: number;
  totalManagers: number;
  totalCollaborators: number;
  pendingInvites: number;
  activeUsers: number;
  totalDepartmentOkrs: number;
};

export type EmployeesResponse = {
  scope: DashboardScope;
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  filters: {
    departments: EmployeeDepartment[];
  };
  kpis: EmployeesKpis;
  employees: EmployeeListItem[];
};

export type EmployeeDetailsResponse = {
  scope: DashboardScope;
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  employee: EmployeeDetailsItem;
};

export type EmployeesFilters = {
  search: string;
  departmentId: string;
  role: "" | DashboardRole;
  status: "" | EmployeeStatus;
  sortBy: "name" | "department" | "role" | "date";
  sortOrder: "asc" | "desc";
};
