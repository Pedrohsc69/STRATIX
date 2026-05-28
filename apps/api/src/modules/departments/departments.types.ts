import type { CycleStatus, UserRole, UserStatus } from '@prisma/client';
import type {
  DashboardCompanyContext,
  DashboardDepartmentContext,
  DashboardPermission,
  DashboardScope,
  DashboardUserContext,
} from '../dashboard/dashboard.types';

export type DepartmentViewStatus = 'ON_TRACK' | 'ATTENTION' | 'AT_RISK' | 'NO_DATA';

export type DepartmentManagerItem = {
  id: string;
  name: string;
  email: string;
};

export type DepartmentCollaboratorItem = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
};

export type DepartmentManagerOption = DepartmentManagerItem;
export type DepartmentCollaboratorOption = {
  id: string;
  name: string;
  email: string;
};

export type DepartmentCycleReference = {
  id: string;
  name: string;
  status: CycleStatus;
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
  manager: DepartmentManagerItem | null;
  collaboratorsCount: number;
  cyclesCount: number;
  objectivesCount: number;
  okrsCount: number;
  averageProgress: number;
  status: DepartmentViewStatus;
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

type DepartmentResponseContext = {
  company: DashboardCompanyContext | null;
  department: DashboardDepartmentContext | null;
  user: DashboardUserContext;
};

export type DepartmentsResponse = {
  scope: DashboardScope;
  role: UserRole;
  permissions: DashboardPermission[];
  context: DepartmentResponseContext;
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
  role: UserRole;
  permissions: DashboardPermission[];
  context: DepartmentResponseContext;
  availableManagers: DepartmentManagerOption[];
  availableCollaborators: DepartmentCollaboratorOption[];
  department: DepartmentDetailsItem;
};
