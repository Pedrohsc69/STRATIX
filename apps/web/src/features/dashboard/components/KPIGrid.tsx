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
        <article key={item.label} className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}>
              <item.icon className="w-5 h-5" />
            </div>
          </div>
          <p className="mb-1 text-sm text-muted-foreground">{item.label}</p>
          <p className="text-3xl font-semibold text-foreground">{item.value}</p>
        </article>
      ))}
    </div>
  );
}
