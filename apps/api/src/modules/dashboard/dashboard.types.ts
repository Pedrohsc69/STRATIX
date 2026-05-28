import type { UserRole, UserStatus } from '@prisma/client';

export type DashboardScope = 'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE';

export type DashboardPermission =
  | 'dashboard:view:company'
  | 'dashboard:view:department'
  | 'dashboard:view:department:readonly'
  | 'departments:manage'
  | 'departments:view:department'
  | 'departments:view:department:readonly'
  | 'users:manage'
  | 'users:view:department'
  | 'cycles:manage'
  | 'cycles:view:department'
  | 'objectives:manage'
  | 'objectives:manage:department'
  | 'objectives:view:department'
  | 'okrs:manage'
  | 'okrs:manage:department'
  | 'okrs:update:own'
  | 'okrs:view:own'
  | 'reports:export'
  | 'settings:manage';

export type DashboardKpis = {
  totalDepartments: number;
  totalEmployees: number;
  totalManagers: number;
  totalCollaborators: number;
  totalStrategicCycles: number;
  activeStrategicCycles: number;
  totalObjectives: number;
  totalOkrs: number;
  ownOkrs: number;
  atRiskOkrs: number;
  completionRate: number;
};

export type DashboardCompanyContext = {
  id: string;
  name: string;
  businessArea: string;
};

export type DashboardDepartmentContext = {
  id: string;
  name: string;
};

export type DashboardUserContext = {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
};

export type DepartmentPerformanceItem = {
  id: string;
  name: string;
  employees: number;
  activeCycles: number;
  completionRate: number;
};

export type StrategicCycleWidgetItem = {
  id: string;
  name: string;
  departmentName: string;
  status: 'ACTIVE' | 'CLOSED';
  startDate: string;
  endDate: string;
  progress: number;
};

export type ObjectiveWidgetItem = {
  id: string;
  name: string;
  departmentName: string;
  cycleName: string;
  progress: number;
  status: 'on_track' | 'attention' | 'at_risk';
};

export type OkrProgressWidgetItem = {
  id: string;
  name: string;
  objectiveName: string;
  departmentName: string;
  ownerName: string;
  progress: number;
  currentValue: number;
  targetValue: number;
  isOwnedByCurrentUser: boolean;
};

export type TeamMemberWidgetItem = {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  departmentName: string | null;
};

export type RiskAlertWidgetItem = {
  id: string;
  name: string;
  departmentName: string;
  ownerName: string;
  progress: number;
  severity: 'medium' | 'high';
};

export type RecentUpdateWidgetItem = {
  id: string;
  type: 'cycle' | 'objective' | 'okr';
  title: string;
  departmentName: string;
  updatedAt: string;
};

export type QuickActionWidgetItem = {
  label: string;
  path: string;
  permission: DashboardPermission;
};

export type DashboardWidgets = {
  executiveOverview: {
    departmentPerformance: DepartmentPerformanceItem[];
    quickActions: QuickActionWidgetItem[];
  } | null;
  departmentOverview: {
    departmentName: string;
    employeeDistribution: Array<{ label: string; value: number }>;
    quickActions: QuickActionWidgetItem[];
  } | null;
  strategicCycles: StrategicCycleWidgetItem[];
  objectives: ObjectiveWidgetItem[];
  okrProgress: OkrProgressWidgetItem[];
  teamMembers: TeamMemberWidgetItem[];
  riskAlerts: RiskAlertWidgetItem[];
  recentUpdates: RecentUpdateWidgetItem[];
};

export type DashboardResponse = {
  scope: DashboardScope;
  role: UserRole;
  permissions: DashboardPermission[];
  context: {
    company: DashboardCompanyContext | null;
    department: DashboardDepartmentContext | null;
    user: DashboardUserContext;
  };
  kpis: DashboardKpis;
  widgets: DashboardWidgets;
};
