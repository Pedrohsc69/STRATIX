import { DashboardLayout } from "../../dashboard/DashboardLayout";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { useDashboardScope } from "../../dashboard/hooks/useDashboardScope";
import { AppearanceSettingsCard } from "../components/AppearanceSettingsCard";
import { CompanySettingsCard } from "../components/CompanySettingsCard";
import { DangerZoneCard } from "../components/DangerZoneCard";
import { NotificationSettingsCard } from "../components/NotificationSettingsCard";
import { SecuritySettingsCard } from "../components/SecuritySettingsCard";
import { useSettings } from "../hooks/useSettings";
import {
  updateCompanySettings,
  updatePersonalSettings,
} from "../services/settings.service";
import type {
  UpdateCompanySettingsPayload,
  UpdatePersonalSettingsPayload,
} from "../types/settings.types";

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white" />
        <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />
        <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { data, loading, error, setData } = useSettings();
  const { permissions } = useDashboardScope(data?.permissions);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-4 sm:p-6 lg:p-8">
        <LoadingState />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-4 sm:p-6 lg:p-8">
        <EmptyDashboardState
          title="Configurações indisponíveis"
          description={error ?? "Não foi possível carregar as configurações."}
        />
      </div>
    );
  }

  const handleSavePersonalSettings = async (payload: UpdatePersonalSettingsPayload) => {
    const response = await updatePersonalSettings(payload);
    setData(response);
  };

  const handleSaveCompany = async (payload: UpdateCompanySettingsPayload) => {
    const nextCompany = await updateCompanySettings(payload);

    setData((current) =>
      current
        ? {
            ...current,
            company: nextCompany,
            context: {
              ...current.context,
              company: current.context.company
                ? {
                    ...current.context.company,
                    name: nextCompany.name,
                    businessArea: nextCompany.businessArea,
                  }
                : current.context.company,
            },
          }
        : current,
    );
  };

  return (
    <DashboardLayout
      context={data.context}
      permissions={permissions}
      role={data.role}
      pageEyebrow="Configurações"
      pageTitle="Configurações do Sistema"
      pageDescription="Gerencie preferências pessoais e, quando permitido, parâmetros administrativos da empresa."
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <AppearanceSettingsCard
            settings={data.settings}
            onSave={handleSavePersonalSettings}
          />
          <NotificationSettingsCard
            settings={data.settings}
            onSave={handleSavePersonalSettings}
          />
        </div>

        <div className={`grid gap-6 ${data.role === "DIRECTOR" ? "xl:grid-cols-2" : ""}`}>
          <SecuritySettingsCard
            profilePath={data.security.profilePath}
            lastAccessAt={data.security.lastAccessAt}
          />

          {data.role === "DIRECTOR" && data.company && data.meta.canManageCompany ? (
            <CompanySettingsCard company={data.company} onSave={handleSaveCompany} />
          ) : null}
        </div>

        {data.role === "DIRECTOR" ? (
          <DangerZoneCard message={data.meta.dangerZoneMessage} />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
