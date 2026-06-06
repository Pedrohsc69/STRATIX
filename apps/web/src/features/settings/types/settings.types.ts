import type {
  DashboardContext,
  DashboardPermission,
  DashboardRole,
  DashboardScope,
} from "../../dashboard/dashboard.types";

export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";
export type InterfaceDensity = "COMFORTABLE" | "COMPACT";

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
  };
};

export type UpdatePersonalSettingsPayload = Partial<PersonalSettings>;

export type UpdateCompanySettingsPayload = {
  name?: string;
  cnpj?: string;
  businessArea?: string;
};
