import type {
  DashboardContext,
  DashboardPermission,
  DashboardRole,
  DashboardScope,
} from "../../dashboard/dashboard.types";

export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";

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

export type SettingsResponse = {
  scope: DashboardScope;
  role: DashboardRole;
  permissions: DashboardPermission[];
  context: DashboardContext;
  settings: PersonalSettings;
  company: CompanySettings | null;
  security: {
    profilePath: string;
    lastAccessAt: string | null;
  };
  meta: {
    canManageCompany: boolean;
    dangerZoneAvailable: boolean;
    dangerZoneMessage: string | null;
    companyDeletion: {
      enabled: boolean;
      requiresPasswordConfirmation: boolean;
      requiresDirectorEmailConfirmation: boolean;
    } | null;
  };
};

export type UpdatePersonalSettingsPayload = Partial<PersonalSettings>;

export type UpdateCompanySettingsPayload = {
  name?: string;
  cnpj?: string;
  businessArea?: string;
};

export type DeleteCompanyPayload = {
  companyNameConfirmation: string;
  currentPassword?: string;
  directorEmailConfirmation?: string;
};

export type DeleteCompanyResponse = {
  success: true;
  redirectTo: string;
};
