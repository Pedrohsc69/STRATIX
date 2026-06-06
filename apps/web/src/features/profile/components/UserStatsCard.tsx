import { Building2, CheckCircle2, Target, Trophy, Users } from "lucide-react";
import { DashboardCard } from "../../dashboard/components/DashboardCard";
import type { ProfileResponse } from "../types/profile.types";

type UserStatsCardProps = {
  role: ProfileResponse["role"];
  stats: ProfileResponse["stats"];
};

function buildItems(role: ProfileResponse["role"], stats: ProfileResponse["stats"]) {
  if (role === "DIRECTOR") {
    return [
      { label: "Empresa vinculada", value: stats.companyName ?? "Não vinculada", icon: Building2 },
      { label: "Departamentos", value: stats.totalDepartments, icon: Users },
      { label: "Funcionários", value: stats.totalEmployees, icon: Users },
      { label: "Ciclos estratégicos", value: stats.totalCycles, icon: Target },
    ];
  }

  if (role === "MANAGER") {
    return [
      { label: "Departamento vinculado", value: stats.departmentName ?? "Sem vínculo", icon: Building2 },
      { label: "Colaboradores", value: stats.totalDepartmentCollaborators, icon: Users },
      { label: "Ciclos do departamento", value: stats.totalDepartmentCycles, icon: Target },
      { label: "OKRs do departamento", value: stats.totalDepartmentOkrs, icon: Trophy },
    ];
  }

  return [
    { label: "Departamento vinculado", value: stats.departmentName ?? "Sem vínculo", icon: Building2 },
    { label: "OKRs sob sua responsabilidade", value: stats.ownOkrs, icon: Trophy },
    { label: "OKRs concluídos", value: stats.completedOwnOkrs, icon: CheckCircle2 },
    { label: "Progresso médio", value: `${stats.averageOwnProgress}%`, icon: Target },
  ];
}

export function UserStatsCard({ role, stats }: UserStatsCardProps) {
  const items = buildItems(role, stats);

  return (
    <DashboardCard
      title="Indicadores do usuário"
      subtitle="Resumo operacional construído a partir do seu papel e do seu vínculo atual."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article key={item.label} className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#1E4E79]">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-[#6B7280]">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#1F2937]">{item.value}</p>
          </article>
        ))}
      </div>
    </DashboardCard>
  );
}
