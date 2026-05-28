import {
  CheckCircle2,
  FileText,
  TriangleAlert,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ObjectivesKpis } from "../types/objectives.types";

type ObjectivesKpiCardsProps = {
  kpis: ObjectivesKpis;
};

export function ObjectivesKpiCards({ kpis }: ObjectivesKpiCardsProps) {
  const items = [
    {
      label: "Total de objetivos",
      value: kpis.totalObjectives,
      icon: FileText,
      tone: "bg-[#EFF6FF] text-[#1E4E79]",
    },
    {
      label: "Em andamento",
      value: kpis.activeObjectives,
      icon: Zap,
      tone: "bg-[#ECFDF5] text-[#16A34A]",
    },
    {
      label: "Concluídos",
      value: kpis.completedObjectives,
      icon: CheckCircle2,
      tone: "bg-[#E0F2FE] text-[#0F2A44]",
    },
    {
      label: "Em risco",
      value: kpis.atRiskObjectives,
      icon: TriangleAlert,
      tone: "bg-[#FEE2E2] text-[#DC2626]",
    },
    {
      label: "Conclusão média",
      value: `${kpis.completionRate}%`,
      icon: TrendingUp,
      tone: "bg-[#FEF3C7] text-[#D97706]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}>
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
