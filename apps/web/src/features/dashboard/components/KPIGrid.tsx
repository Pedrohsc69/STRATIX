import {
  Building2,
  CheckCircle2,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { DashboardKpis, DashboardRole } from "../dashboard.types";

type KPIGridProps = {
  kpis: DashboardKpis;
  role: DashboardRole;
};

export function KPIGrid({ kpis, role }: KPIGridProps) {
  const items =
    role === "DIRECTOR"
      ? [
          { label: "Departamentos", value: kpis.totalDepartments, icon: Building2, tone: "bg-[#EFF6FF] text-[#1E4E79]" },
          { label: "Funcionários", value: kpis.totalEmployees, icon: Users, tone: "bg-[#ECFDF5] text-[#16A34A]" },
          { label: "Ciclos Ativos", value: kpis.activeStrategicCycles, icon: Target, tone: "bg-[#FEF3C7] text-[#D97706]" },
          { label: "OKRs em Risco", value: kpis.atRiskOkrs, icon: TriangleAlert, tone: "bg-[#FEE2E2] text-[#DC2626]" },
          { label: "Conclusão Média", value: `${kpis.completionRate}%`, icon: CheckCircle2, tone: "bg-[#E0F2FE] text-[#0F2A44]" },
        ]
      : [
          { label: "Equipe", value: kpis.totalEmployees, icon: Users, tone: "bg-[#EFF6FF] text-[#1E4E79]" },
          { label: "Ciclos Ativos", value: kpis.activeStrategicCycles, icon: Target, tone: "bg-[#ECFDF5] text-[#16A34A]" },
          {
            label: role === "EMPLOYEE" ? "Meus OKRs" : "OKRs do Departamento",
            value: role === "EMPLOYEE" ? kpis.ownOkrs : kpis.totalOkrs,
            icon: CheckCircle2,
            tone: "bg-[#FEF3C7] text-[#D97706]",
          },
          { label: "Itens em Risco", value: kpis.atRiskOkrs, icon: TriangleAlert, tone: "bg-[#FEE2E2] text-[#DC2626]" },
        ];

  return (
    <div className={`grid gap-5 ${role === "DIRECTOR" ? "xl:grid-cols-5 md:grid-cols-3" : "xl:grid-cols-4 md:grid-cols-2"} grid-cols-1`}>
      {items.map((item) => (
        <article key={item.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.tone}`}>
              <item.icon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-[#6B7280] mb-1">{item.label}</p>
          <p className="text-3xl font-semibold text-[#1F2937]">{item.value}</p>
        </article>
      ))}
    </div>
  );
}
