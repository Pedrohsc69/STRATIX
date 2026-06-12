import { DashboardLayout } from "../../dashboard/DashboardLayout";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { useDashboardScope } from "../../dashboard/hooks/useDashboardScope";
import { ChangePasswordCard } from "../components/ChangePasswordCard";
import { OrganizationInfoCard } from "../components/OrganizationInfoCard";
import { ProfileHeaderCard } from "../components/ProfileHeaderCard";
import { ProfileInfoCard } from "../components/ProfileInfoCard";
import { RolePermissionsCard } from "../components/RolePermissionsCard";
import { UserStatsCard } from "../components/UserStatsCard";
import { useProfile } from "../hooks/useProfile";
import {
  changePassword,
  requestOwnPasswordRecovery,
  uploadAvatar,
} from "../services/profile.service";

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-52 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white" />
        <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />
    </div>
  );
}

export function ProfilePage() {
  const { data, loading, error, reload } = useProfile();
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
          title="Perfil indisponível"
          description={error ?? "Não foi possível carregar as informações do perfil."}
        />
      </div>
    );
  }

  return (
    <DashboardLayout
      context={data.context}
      permissions={permissions}
      role={data.role}
      pageEyebrow="Perfil"
      pageTitle="Meu Perfil"
      pageDescription="Gerencie suas informações pessoais e visualize seu vínculo organizacional."
    >
      <div className="space-y-6">
        <ProfileHeaderCard
          profile={data.profile}
          onUpdateAvatar={async (file) => {
            await uploadAvatar(file);
            reload();
          }}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <ProfileInfoCard profile={data.profile} />
          <OrganizationInfoCard profile={data.profile} />
        </div>

        <UserStatsCard role={data.role} stats={data.stats} />
        <RolePermissionsCard permissions={data.permissions} />
        <ChangePasswordCard
          email={data.profile.email}
          security={data.security}
          onChangePassword={async (payload) => {
            await changePassword(payload);
          }}
          onRequestRecovery={async (email) => {
            await requestOwnPasswordRecovery(email);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
