export type DashboardRole = "DIRECTOR" | "MANAGER" | "EMPLOYEE";

export type DashboardScope = "COMPANY" | "DEPARTMENT" | "EMPLOYEE";

export type DashboardPermission =
  | "dashboard:view:company"
  | "dashboard:view:department"
  | "dashboard:view:department:readonly"
  | "departments:manage"
  | "departments:view:department"
  | "departments:view:department:readonly"
  | "users:manage"
  | "users:view:department"
  | "cycles:manage"
  | "cycles:view:department"
  | "objectives:manage"
  | "objectives:manage:department"
  | "objectives:view:department"
  | "okrs:manage"
  | "okrs:manage:department"
  | "okrs:update:own"
  | "okrs:view:own"
  | "reports:export"
  | "settings:manage";

export type DashboardContext = {
  company: {
    id: string;
    name: string;
    businessArea: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string;
    role: DashboardRole;
    status: "PENDING" | "ACTIVE" | "DISABLED";
  };
};

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

export type QuickAction = {
  label: string;
  path: string;
  permission: DashboardPermission;
};

export type DepartmentPerformanceItem = {
  id: string;
  name: string;
  employees: number;
  activeCycles: number;
  completionRate: number;
};

export type StrategicCycleItem = {
  id: string;
  name: string;
  departmentName: string;
  status: "ACTIVE" | "CLOSED";
  startDate: string;
  endDate: string;
  progress: number;
};

export type ObjectiveItem = {
  id: string;
  name: string;
  departmentName: string;
  cycleName: string;
  progress: number;
  status: "on_track" | "attention" | "at_risk";
};

export type OkrProgressItem = {
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

export type TeamMemberItem = {
  id: string;
  name: string;
  role: DashboardRole;
  status: "PENDING" | "ACTIVE" | "DISABLED";
  departmentName: string | null;
};

export type RiskAlertItem = {
  id: string;
  name: string;
  departmentName: string;
  ownerName: string;
  progress: number;
  severity: "medium" | "high";
};

export type RecentUpdateItem = {
  id: string;
  type: "cycle" | "objective" | "okr";
  title: string;
  departmentName: string;
  updatedAt: string;
};

export type DashboardResponse = {
  scope: DashboardScope;
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  kpis: DashboardKpis;
  widgets: {
    executiveOverview: {
      departmentPerformance: DepartmentPerformanceItem[];
      quickActions: QuickAction[];
    } | null;
    departmentOverview: {
      departmentName: string;
      employeeDistribution: Array<{ label: string; value: number }>;
      quickActions: QuickAction[];
    } | null;
    strategicCycles: StrategicCycleItem[];
    objectives: ObjectiveItem[];
    okrProgress: OkrProgressItem[];
    teamMembers: TeamMemberItem[];
    riskAlerts: RiskAlertItem[];
    recentUpdates: RecentUpdateItem[];
  };
};

export type DashboardWidgetId =
  | "executiveOverview"
  | "departmentOverview"
  | "strategicCycles"
  | "objectives"
  | "okrProgress"
  | "teamMembers"
  | "riskAlerts"
  | "recentUpdates";
