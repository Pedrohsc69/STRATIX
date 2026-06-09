import type {
  DashboardContext,
  DashboardPermission,
  DashboardRole,
  DashboardScope,
} from "../../dashboard/dashboard.types";

export type ReportFormat = "csv" | "pdf";
export type ReportType = "COMPANY" | "CYCLE" | "DEPARTMENT";

export type ReportDepartmentOption = {
  id: string;
  name: string;
};

export type ReportCycleOption = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  status: "ACTIVE" | "CLOSED";
};

export type ReportsOptionsResponse = {
  scope: DashboardScope;
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  supportedFormats: ReportFormat[];
  departments: ReportDepartmentOption[];
  cycles: ReportCycleOption[];
};

export type ReportsFilters = {
  departmentId: string;
  cycleId: string;
};

export type RecentReportItem = {
  id: string;
  type: ReportType;
  label: string;
  format: ReportFormat;
  generatedAt: string;
  filename: string;
};
