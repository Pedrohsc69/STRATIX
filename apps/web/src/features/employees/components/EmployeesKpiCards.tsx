import {
  CheckCircle2,
  Clock3,
  Target,
  UserCog,
  Users,
} from "lucide-react";
import type { DashboardRole } from "../../dashboard/dashboard.types";
import type { EmployeesKpis } from "../types/employees.types";

type EmployeesKpiCardsProps = {
  kpis: EmployeesKpis;
  role: DashboardRole;
};

export function EmployeesKpiCards({ kpis, role }: EmployeesKpiCardsProps) {
  const items =
    role === "DIRECTOR"
      ? [
          {
            label: "Funcionários",
            value: kpis.totalEmployees,
            icon: Users,
            tone: "bg-[#EFF6FF] text-[#1E4E79]",
          },
          {
            label: "Gestores",
            value: kpis.totalManagers,
            icon: UserCog,
            tone: "bg-[#ECFDF5] text-[#16A34A]",
          },
          {
            label: "Colaboradores",
            value: kpis.totalCollaborators,
            icon: Users,
            tone: "bg-[#FEF3C7] text-[#D97706]",
          },
          {
            label: "Convites pendentes",
            value: kpis.pendingInvites,
            icon: Clock3,
            tone: "bg-[#FEF3C7] text-[#92400E]",
          },
          {
            label: "Usuários ativos",
            value: kpis.activeUsers,
            icon: CheckCircle2,
            tone: "bg-[#DCFCE7] text-[#166534]",
          },
        ]
      : [
          {
            label: "Usuários do departamento",
            value: kpis.totalEmployees,
            icon: Users,
            tone: "bg-[#EFF6FF] text-[#1E4E79]",
          },
          {
            label: "Colaboradores",
            value: kpis.totalCollaborators,
            icon: UserCog,
            tone: "bg-[#ECFDF5] text-[#16A34A]",
          },
          {
            label: "OKRs do departamento",
            value: kpis.totalDepartmentOkrs,
            icon: Target,
            tone: "bg-[#E0F2FE] text-[#0F2A44]",
          },
          {
            label: "Usuários ativos",
            value: kpis.activeUsers,
            icon: CheckCircle2,
            tone: "bg-[#DCFCE7] text-[#166534]",
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
