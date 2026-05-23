import { Target } from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { ProgressIndicator } from "../components/ProgressIndicator";
import type { ObjectiveItem } from "../dashboard.types";

type ObjectivesWidgetProps = {
  objectives: ObjectiveItem[];
};

export function ObjectivesWidget({ objectives }: ObjectivesWidgetProps) {
  return (
    <DashboardCard title="Objetivos Prioritários" subtitle="Objetivos estratégicos em acompanhamento">
      <div className="space-y-4">
        {objectives.map((objective) => (
          <div key={objective.id} className="rounded-xl border border-gray-100 bg-[#F8FAFC] p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#1E4E79]" />
                </div>
                <div>
                  <p className="font-semibold text-[#1F2937]">{objective.name}</p>
                  <p className="text-sm text-[#6B7280]">
                    {objective.departmentName} • {objective.cycleName}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  objective.status === "on_track"
                    ? "bg-[#DCFCE7] text-[#166534]"
                    : objective.status === "attention"
                    ? "bg-[#FEF3C7] text-[#92400E]"
                    : "bg-[#FEE2E2] text-[#991B1B]"
                }`}
              >
                {objective.status === "on_track"
                  ? "No ritmo"
                  : objective.status === "attention"
                  ? "Atenção"
                  : "Risco"}
              </span>
            </div>
            <ProgressIndicator
              value={objective.progress}
              tone={
                objective.status === "on_track"
                  ? "success"
                  : objective.status === "attention"
                  ? "warning"
                  : "danger"
              }
            />
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
