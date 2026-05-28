import type { UserRole } from '@prisma/client';
import type {
  DashboardCompanyContext,
  DashboardDepartmentContext,
  DashboardPermission,
  DashboardScope,
  DashboardUserContext,
} from '../dashboard/dashboard.types';

export type ReportFormat = 'csv' | 'pdf';

export type ReportDepartmentOption = {
  id: string;
  name: string;
};

export type ReportCycleOption = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  status: 'ACTIVE' | 'CLOSED';
};

type ReportsResponseContext = {
  company: DashboardCompanyContext | null;
  department: DashboardDepartmentContext | null;
  user: DashboardUserContext;
};

export type ReportsOptionsResponse = {
  scope: DashboardScope;
  role: UserRole;
  permissions: DashboardPermission[];
  context: ReportsResponseContext;
  supportedFormats: ReportFormat[];
  departments: ReportDepartmentOption[];
  cycles: ReportCycleOption[];
};

export type ReportExportPayload = {
  filename: string;
  contentType: string;
  content: string;
};
