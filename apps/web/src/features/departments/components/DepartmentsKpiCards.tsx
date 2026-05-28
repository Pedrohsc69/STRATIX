import {
  Building2,
  CheckCircle2,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import type { DashboardRole } from "../../dashboard/dashboard.types";
import type { DepartmentsKpis } from "../types/departments.types";

type DepartmentsKpiCardsProps = {
  kpis: DepartmentsKpis;
  role: DashboardRole;
};

export function DepartmentsKpiCards({ kpis, role }: DepartmentsKpiCardsProps) {
  const items =
    role === "DIRECTOR"
      ? [
          {
            label: "Departamentos",
            value: kpis.totalDepartments,
            icon: Building2,
            tone: "bg-[#EFF6FF] text-[#1E4E79]",
          },
          {
            label: "Gestores",
            value: kpis.totalManagers,
            icon: Trophy,
            tone: "bg-[#ECFDF5] text-[#16A34A]",
          },
          {
            label: "Colaboradores",
            value: kpis.totalCollaborators,
            icon: Users,
            tone: "bg-[#FEF3C7] text-[#D97706]",
          },
          {
            label: "Ciclos vinculados",
            value: kpis.totalCycles,
            icon: Target,
            tone: "bg-[#E0F2FE] text-[#0F2A44]",
          },
          {
            label: "Progresso médio",
            value: `${kpis.averageProgress}%`,
            icon: CheckCircle2,
            tone: "bg-[#F0FDF4] text-[#0F766E]",
          },
        ]
      : role === "MANAGER"
      ? [
          {
            label: "Colaboradores",
            value: kpis.totalCollaborators,
            icon: Users,
            tone: "bg-[#EFF6FF] text-[#1E4E79]",
          },
          {
            label: "Ciclos",
            value: kpis.totalCycles,
            icon: Target,
            tone: "bg-[#ECFDF5] text-[#16A34A]",
          },
          {
            label: "Objetivos",
            value: kpis.totalObjectives,
            icon: Trophy,
            tone: "bg-[#FEF3C7] text-[#D97706]",
          },
          {
            label: "OKRs",
            value: kpis.totalOkrs,
            icon: CheckCircle2,
            tone: "bg-[#E0F2FE] text-[#0F2A44]",
          },
        ]
      : [
          {
            label: "Ciclos",
            value: kpis.totalCycles,
            icon: Target,
            tone: "bg-[#EFF6FF] text-[#1E4E79]",
          },
          {
            label: "Objetivos",
            value: kpis.totalObjectives,
            icon: Trophy,
            tone: "bg-[#ECFDF5] text-[#16A34A]",
          },
          {
            label: "OKRs",
            value: kpis.totalOkrs,
            icon: CheckCircle2,
            tone: "bg-[#FEF3C7] text-[#D97706]",
          },
          {
            label: "Progresso médio",
            value: `${kpis.averageProgress}%`,
            icon: Building2,
            tone: "bg-[#E0F2FE] text-[#0F2A44]",
          },
        ];

  return (
    <div
      className={`grid gap-5 ${
        role === "DIRECTOR" ? "xl:grid-cols-5 md:grid-cols-3" : "xl:grid-cols-4 md:grid-cols-2"
      } grid-cols-1`}
    >
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}
            >
              <item.icon className="h-5 w-5" />
            </div>
          </div>
          <p className="mb-1 text-sm text-[#6B7280]">{item.label}</p>
          <p className="text-3xl font-semibold text-[#1F2937]">{item.value}</p>
        </article>
      ))}
    </div>
  );
}
