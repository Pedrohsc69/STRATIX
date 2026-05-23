import { CalendarRange } from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { ProgressIndicator } from "../components/ProgressIndicator";
import type { StrategicCycleItem } from "../dashboard.types";

type StrategicCyclesWidgetProps = {
  cycles: StrategicCycleItem[];
};

export function StrategicCyclesWidget({ cycles }: StrategicCyclesWidgetProps) {
  return (
    <DashboardCard title="Ciclos Estratégicos" subtitle="Andamento recente dos ciclos prioritários">
      <div className="space-y-4">
        {cycles.map((cycle) => (
          <div key={cycle.id} className="rounded-xl border border-gray-100 bg-[#F8FAFC] p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-semibold text-[#1F2937]">{cycle.name}</p>
                <p className="text-sm text-[#6B7280]">{cycle.departmentName}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  cycle.status === "ACTIVE"
                    ? "bg-[#DBEAFE] text-[#1E40AF]"
                    : "bg-[#E5E7EB] text-[#4B5563]"
                }`}
              >
                {cycle.status === "ACTIVE" ? "Ativo" : "Encerrado"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-3">
              <CalendarRange className="w-4 h-4" />
              <span>
                {new Date(cycle.startDate).toLocaleDateString("pt-BR")} -{" "}
                {new Date(cycle.endDate).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <ProgressIndicator value={cycle.progress} tone="brand" />
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
