import { TriangleAlert } from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import type { RiskAlertItem } from "../dashboard.types";

type RiskAlertsWidgetProps = {
  alerts: RiskAlertItem[];
};

export function RiskAlertsWidget({ alerts }: RiskAlertsWidgetProps) {
  return (
    <DashboardCard title="Alertas de Risco" subtitle="Itens que exigem acompanhamento prioritário">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-xl border p-4 ${
              alert.severity === "high"
                ? "bg-[#FEF2F2] border-[#FECACA]"
                : "bg-[#FFFBEB] border-[#FDE68A]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  alert.severity === "high" ? "bg-[#FEE2E2]" : "bg-[#FEF3C7]"
                }`}
              >
                <TriangleAlert
                  className={`w-5 h-5 ${
                    alert.severity === "high" ? "text-[#DC2626]" : "text-[#D97706]"
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold text-[#1F2937]">{alert.name}</p>
                <p className="text-sm text-[#6B7280]">
                  {alert.departmentName} • {alert.ownerName}
                </p>
                <p className="text-sm font-medium mt-2 text-[#1F2937]">
                  Progresso atual: {alert.progress}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
