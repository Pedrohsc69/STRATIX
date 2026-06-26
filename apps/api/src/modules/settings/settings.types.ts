import type { ThemePreference, UserRole } from '@prisma/client';
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
  companyDeletion:
    | {
        enabled: boolean;
        requiresPasswordConfirmation: boolean;
        requiresDirectorEmailConfirmation: boolean;
      }
    | null;
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

export type DeleteCompanyResponse = {
  success: true;
  redirectTo: string;
};
