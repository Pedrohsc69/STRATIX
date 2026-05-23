import { Link } from "react-router-dom";
import { DashboardCard } from "../components/DashboardCard";
import type { DashboardPermission, QuickAction } from "../dashboard.types";

type DepartmentOverviewWidgetProps = {
  departmentName: string;
  employeeDistribution: Array<{ label: string; value: number }>;
  quickActions: QuickAction[];
  readOnly: boolean;
  canAccess: (permission: DashboardPermission | DashboardPermission[]) => boolean;
};

export function DepartmentOverviewWidget({
  departmentName,
  employeeDistribution,
  quickActions,
  readOnly,
  canAccess,
}: DepartmentOverviewWidgetProps) {
  return (
    <DashboardCard
      title={`Panorama de ${departmentName}`}
      subtitle={
        readOnly
          ? "Resumo informativo do seu departamento"
          : "Indicadores e atalhos operacionais do departamento"
      }
    >
      <div className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {employeeDistribution.map((item) => (
            <div key={item.label} className="rounded-xl bg-[#F8FAFC] border border-gray-100 p-4">
              <p className="text-sm text-[#6B7280] mb-1">{item.label}</p>
              <p className="text-3xl font-semibold text-[#1F2937]">{item.value}</p>
            </div>
          ))}
        </div>

        {!readOnly && quickActions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#6B7280]">Ações permitidas</p>
            {quickActions
              .filter((action) => canAccess(action.permission))
              .map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="block rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#0F2A44] hover:bg-[#F8FAFC] transition-colors"
                >
                  {action.label}
                </Link>
              ))}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
