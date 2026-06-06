import type {
  InterfaceDensity,
  ThemePreference,
  UserRole,
} from '@prisma/client';
import type {
  DashboardCompanyContext,
  DashboardDepartmentContext,
  DashboardPermission,
  DashboardScope,
  DashboardUserContext,
} from '../dashboard/dashboard.types';

export type SettingsContext = {
  company: DashboardCompanyContext | null;
  department: DashboardDepartmentContext | null;
  user: DashboardUserContext;
};

export type PersonalSettings = {
  theme: ThemePreference;
  density: InterfaceDensity;
  language: string;
  emailNotifications: boolean;
  inviteNotifications: boolean;
  okrNotifications: boolean;
  cycleNotifications: boolean;
};

export type CompanySettings = {
  id: string;
  name: string;
  cnpj: string;
  businessArea: string;
  canEdit: boolean;
};

export type SettingsSecurityInfo = {
  profilePath: string;
  lastAccessAt: string | null;
};

export type SettingsMeta = {
  canManageCompany: boolean;
  dangerZoneAvailable: boolean;
  dangerZoneMessage: string | null;
};

export type SettingsResponse = {
  scope: DashboardScope;
  role: UserRole;
  permissions: DashboardPermission[];
  context: SettingsContext;
  settings: PersonalSettings;
  company: CompanySettings | null;
  security: SettingsSecurityInfo;
  meta: SettingsMeta;
};
