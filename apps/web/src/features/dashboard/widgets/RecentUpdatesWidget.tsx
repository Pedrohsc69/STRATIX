import { Clock3 } from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import type { RecentUpdateItem } from "../dashboard.types";

type RecentUpdatesWidgetProps = {
  updates: RecentUpdateItem[];
};

const typeLabelMap = {
  cycle: "Ciclo",
  objective: "Objetivo",
  okr: "OKR",
};

export function RecentUpdatesWidget({ updates }: RecentUpdatesWidgetProps) {
  return (
    <DashboardCard title="Atualizações Recentes" subtitle="Movimentações mais recentes do escopo atual">
      <div className="space-y-3">
        {updates.map((update) => (
          <div
            key={`${update.type}-${update.id}`}
            className="rounded-xl border border-gray-100 bg-[#F8FAFC] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-[#1F2937]">{update.title}</p>
                <p className="text-sm text-[#6B7280]">
                  {typeLabelMap[update.type]} • {update.departmentName}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <Clock3 className="w-4 h-4" />
                {new Date(update.updatedAt).toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
