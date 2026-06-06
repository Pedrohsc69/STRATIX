import { BriefcaseBusiness, Building2, Crown, UsersRound } from "lucide-react";
import { DashboardCard } from "../../dashboard/components/DashboardCard";
import type { ProfileResponse } from "../types/profile.types";

type OrganizationInfoCardProps = {
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

export function OrganizationInfoCard({ profile }: OrganizationInfoCardProps) {
  const items = [
    {
      label: "Empresa",
      value: profile.company?.name ?? "Empresa não vinculada",
      icon: Building2,
    },
    {
      label: "Departamento",
      value: profile.department?.name ?? "Sem departamento vinculado",
      icon: BriefcaseBusiness,
    },
    {
      label: "Gestor responsável",
      value: profile.manager?.name ?? "Sem gestor definido",
      icon: UsersRound,
      secondary: profile.manager?.email ?? null,
    },
    {
      label: "Função organizacional",
      value: getRoleLabel(profile.role),
      icon: Crown,
    },
  ];

  return (
    <DashboardCard
      title="Vínculo organizacional"
      subtitle="Escopo empresarial e departamental associado à sua conta."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.label} className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1E4E79]">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#6B7280]">{item.label}</p>
                <p className="mt-1 text-sm font-medium text-[#1F2937]">{item.value}</p>
                {item.secondary ? (
                  <p className="mt-1 text-xs text-[#6B7280]">{item.secondary}</p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </DashboardCard>
  );
}
