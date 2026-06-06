import { api } from "../../../services/api";
import type {
  CompanySettings,
  SettingsResponse,
  UpdateCompanySettingsPayload,
  UpdatePersonalSettingsPayload,
} from "../types/settings.types";

export async function fetchSettings() {
  const response = await api.get<SettingsResponse>("/settings/me");
  return response.data;
}

export async function updatePersonalSettings(payload: UpdatePersonalSettingsPayload) {
  const response = await api.patch<SettingsResponse>("/settings/me", payload);
  return response.data;
}

export async function fetchCompanySettings() {
  const response = await api.get<CompanySettings>("/settings/company");
  return response.data;
}

export async function updateCompanySettings(payload: UpdateCompanySettingsPayload) {
  const response = await api.patch<CompanySettings>("/settings/company", payload);
  return response.data;
}
