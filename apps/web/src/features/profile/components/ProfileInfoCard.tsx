import { BadgeCheck, Mail, ShieldCheck, UserRound } from "lucide-react";
import { DashboardCard } from "../../dashboard/components/DashboardCard";
import type { ProfileResponse } from "../types/profile.types";

type ProfileInfoCardProps = {
  profile: ProfileResponse["profile"];
};

function getRoleLabel(role: ProfileResponse["profile"]["role"]) {
  if (role === "DIRECTOR") {
    return "Diretor";
  }

  if (role === "MANAGER") {
    return "Gestor";
  }

  return "Colaborador";
}

function getStatusLabel(status: ProfileResponse["profile"]["status"]) {
  if (status === "ACTIVE") {
    return "Conta ativa";
  }

  if (status === "PENDING") {
    return "Conta pendente";
  }

  return "Conta desativada";
}

const items = [
  { key: "name", label: "Nome completo", icon: UserRound },
  { key: "email", label: "E-mail corporativo", icon: Mail },
  { key: "role", label: "Função no sistema", icon: ShieldCheck },
  { key: "status", label: "Status da conta", icon: BadgeCheck },
] as const;

export function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
  const values = {
    name: profile.name,
    email: profile.email,
    role: getRoleLabel(profile.role),
    status: getStatusLabel(profile.status),
  };

  return (
    <DashboardCard
      title="Informações pessoais"
      subtitle="Dados cadastrais disponíveis para consulta no ambiente autenticado."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.key} className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1E4E79]">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#6B7280]">{item.label}</p>
                <p className="mt-1 text-sm font-medium text-[#1F2937]">{values[item.key]}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </DashboardCard>
  );
}
