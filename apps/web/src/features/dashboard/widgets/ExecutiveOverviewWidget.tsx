import { Link } from "react-router-dom";
import { DashboardCard } from "../components/DashboardCard";
import { ProgressIndicator } from "../components/ProgressIndicator";
import type { DashboardPermission, DepartmentPerformanceItem, QuickAction } from "../dashboard.types";

type ExecutiveOverviewWidgetProps = {
  departmentPerformance: DepartmentPerformanceItem[];
  quickActions: QuickAction[];
  canAccess: (permission: DashboardPermission | DashboardPermission[]) => boolean;
};

export function ExecutiveOverviewWidget({
  departmentPerformance,
  quickActions,
  canAccess,
}: ExecutiveOverviewWidgetProps) {
  return (
    <DashboardCard
      title="Visão Executiva"
      subtitle="Desempenho consolidado dos departamentos e atalhos de gestão"
      className="h-full"
    >
      <div className="grid xl:grid-cols-[1.7fr_1fr] gap-6">
        <div className="space-y-4">
          {departmentPerformance.map((department) => (
            <div key={department.id} className="p-4 rounded-xl bg-[#F8FAFC] border border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-[#1F2937]">{department.name}</p>
                  <p className="text-sm text-[#6B7280]">
                    {department.employees} pessoas • {department.activeCycles} ciclos ativos
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#0F2A44]">
                  {department.completionRate}%
                </span>
              </div>
              <ProgressIndicator value={department.completionRate} tone="brand" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#6B7280]">Atalhos operacionais</p>
          {quickActions
            .filter((action) => canAccess(action.permission))
            .map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="block rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#0F2A44] hover:bg-[#F8FAFC] transition-colors"
              >
                {action.label}
              </Link>
            ))}
        </div>
      </div>
    </DashboardCard>
  );
}
