import type { UserRole, UserStatus } from '@prisma/client';
import type {
  DashboardCompanyContext,
  DashboardDepartmentContext,
  DashboardPermission,
  DashboardScope,
  DashboardUserContext,
} from '../dashboard/dashboard.types';

export type EmployeeDirectoryKind = 'USER' | 'INVITE';
export type EmployeeListStatus = UserStatus | 'EXPIRED';

export type EmployeeDepartmentItem = {
  id: string;
  name: string;
};

export type EmployeeListItem = {
  id: string;
  kind: EmployeeDirectoryKind;
  name: string | null;
  email: string;
  role: UserRole;
  department: EmployeeDepartmentItem | null;
  status: EmployeeListStatus;
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
  role: UserRole;
  status: UserStatus;
  department: EmployeeDepartmentItem | null;
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

type EmployeesResponseContext = {
  company: DashboardCompanyContext | null;
  department: DashboardDepartmentContext | null;
  user: DashboardUserContext;
};

export type EmployeesResponse = {
  scope: DashboardScope;
  role: UserRole;
  permissions: DashboardPermission[];
  context: EmployeesResponseContext;
  filters: {
    departments: EmployeeDepartmentItem[];
  };
  kpis: EmployeesKpis;
  employees: EmployeeListItem[];
};

export type EmployeeDetailsResponse = {
  scope: DashboardScope;
  role: UserRole;
  permissions: DashboardPermission[];
  context: EmployeesResponseContext;
  employee: EmployeeDetailsItem;
};

export type ProfileManagerItem = {
  id: string;
  name: string;
  email: string;
};

export type ProfileStats = {
  companyName: string | null;
  departmentName: string | null;
  totalDepartments: number;
  totalEmployees: number;
  totalCycles: number;
  totalDepartmentCollaborators: number;
  totalDepartmentCycles: number;
  totalDepartmentOkrs: number;
  ownOkrs: number;
  completedOwnOkrs: number;
  averageOwnProgress: number;
};

export type ProfileSecurity = {
  canChangePassword: boolean;
  changePasswordPath: string | null;
  lastAccessAt: string | null;
  recoveryAvailable: boolean;
};

export type ProfileResponse = {
  scope: DashboardScope;
  role: UserRole;
  permissions: DashboardPermission[];
  context: EmployeesResponseContext;
  profile: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    avatarUrl: string | null;
    company: DashboardCompanyContext | null;
    department: DashboardDepartmentContext | null;
    manager: ProfileManagerItem | null;
  };
  stats: ProfileStats;
  security: ProfileSecurity;
};
