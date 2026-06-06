import { useEffect, useState, type FormEvent } from "react";
import { Camera, Mail, PencilLine } from "lucide-react";
import { DashboardCard } from "../../dashboard/components/DashboardCard";
import { EmployeeRoleBadge } from "../../employees/components/EmployeeRoleBadge";
import { EmployeeStatusBadge } from "../../employees/components/EmployeeStatusBadge";
import type { ProfileResponse } from "../types/profile.types";

type ProfileHeaderCardProps = {
  profile: ProfileResponse["profile"];
  onUpdateAvatar: (avatarUrl: string) => Promise<void>;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileHeaderCard({ profile, onUpdateAvatar }: ProfileHeaderCardProps) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile.avatarUrl]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      setLoading(true);
      await onUpdateAvatar(avatarUrl.trim());
      setSuccessMessage("Avatar atualizado com sucesso.");
    } catch (requestError) {
      const maybeError = requestError as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      };

      if (typeof maybeError.response?.data?.message === "string") {
        setError(maybeError.response.data.message);
      } else if (Array.isArray(maybeError.response?.data?.message)) {
        setError(maybeError.response.data.message.join(", "));
      } else {
        setError("Não foi possível atualizar o avatar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard title="Identidade da conta" subtitle="Dados principais do usuário autenticado.">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="relative">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1E4E79] text-2xl font-semibold text-white">
              {getInitials(profile.name)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#6B7280]">
            <Camera className="h-4 w-4" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#1F2937]">{profile.name}</h2>
              <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#4B5563]">
              Avatar por URL segura
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <EmployeeRoleBadge role={profile.role} />
            <EmployeeStatusBadge status={profile.status} />
          </div>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">URL do avatar</span>
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PencilLine className="h-4 w-4" />
                {loading ? "Salvando..." : "Atualizar avatar"}
              </button>
            </div>
          </form>

          {error ? (
            <div className="mt-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
              {successMessage}
            </div>
          ) : null}
        </div>
      </div>
    </DashboardCard>
  );
}
