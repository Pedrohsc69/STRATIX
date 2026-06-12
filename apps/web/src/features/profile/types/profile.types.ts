import type {
  DashboardContext,
  DashboardPermission,
  DashboardRole,
  DashboardScope,
} from "../../dashboard/dashboard.types";

export type ProfileStatus = "PENDING" | "ACTIVE" | "DISABLED";

export type ProfileManager = {
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
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  profile: {
    id: string;
    name: string;
    email: string;
    role: DashboardRole;
    status: ProfileStatus;
    avatarUrl: string | null;
    company: {
      id: string;
      name: string;
      businessArea: string;
    } | null;
    department: {
      id: string;
      name: string;
    } | null;
    manager: ProfileManager | null;
  };
  stats: ProfileStats;
  security: ProfileSecurity;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
