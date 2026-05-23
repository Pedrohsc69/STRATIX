import { DashboardCard } from "../components/DashboardCard";
import { ProgressIndicator } from "../components/ProgressIndicator";
import type { OkrProgressItem } from "../dashboard.types";

type OKRProgressWidgetProps = {
  okrs: OkrProgressItem[];
  title?: string;
};

export function OKRProgressWidget({
  okrs,
  title = "Progresso dos OKRs",
}: OKRProgressWidgetProps) {
  return (
    <DashboardCard title={title} subtitle="Acompanhamento das metas mais relevantes">
      <div className="space-y-4">
        {okrs.map((okr) => (
          <div key={okr.id} className="rounded-xl border border-gray-100 bg-[#F8FAFC] p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-semibold text-[#1F2937]">{okr.name}</p>
                <p className="text-sm text-[#6B7280]">
                  {okr.departmentName} • {okr.objectiveName}
                </p>
                <p className="text-xs text-[#6B7280] mt-1">
                  Responsável: {okr.ownerName}
                  {okr.isOwnedByCurrentUser ? " • Você" : ""}
                </p>
              </div>
              <span className="text-sm font-semibold text-[#0F2A44]">
                {okr.currentValue}/{okr.targetValue}
              </span>
            </div>
            <ProgressIndicator
              value={okr.progress}
              tone={okr.progress >= 70 ? "success" : okr.progress >= 40 ? "warning" : "danger"}
            />
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
