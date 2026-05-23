import { EmptyDashboardState } from "./components/EmptyDashboardState";
import { KPIGrid } from "./components/KPIGrid";
import { DashboardLayout } from "./DashboardLayout";
import { useDashboardData } from "./hooks/useDashboardData";
import { useDashboardScope } from "./hooks/useDashboardScope";
import { getDashboardWidgetsByRole } from "./utils/get-dashboard-widgets-by-role";
import { DepartmentOverviewWidget } from "./widgets/DepartmentOverviewWidget";
import { ExecutiveOverviewWidget } from "./widgets/ExecutiveOverviewWidget";
import { ObjectivesWidget } from "./widgets/ObjectivesWidget";
import { OKRProgressWidget } from "./widgets/OKRProgressWidget";
import { RecentUpdatesWidget } from "./widgets/RecentUpdatesWidget";
import { RiskAlertsWidget } from "./widgets/RiskAlertsWidget";
import { StrategicCyclesWidget } from "./widgets/StrategicCyclesWidget";
import { TeamMembersWidget } from "./widgets/TeamMembersWidget";

function LoadingDashboard() {
  return (
    <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-32 rounded-2xl bg-white border border-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { data, loading, error } = useDashboardData();
  const { permissions, canAccess } = useDashboardScope(data?.permissions);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-8">
        <LoadingDashboard />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-8">
        <EmptyDashboardState
          title="Dashboard indisponível"
          description={error ?? "Não foi possível obter o panorama estratégico neste momento."}
        />
      </div>
    );
  }

  const widgetOrder = getDashboardWidgetsByRole(data, permissions);
  const isEmployeeReadOnly = canAccess("dashboard:view:department:readonly");

  return (
    <DashboardLayout context={data.context} permissions={permissions} role={data.role}>
      <div className="space-y-6">
        <KPIGrid kpis={data.kpis} role={data.role} />

        {widgetOrder.length === 0 ? (
          <EmptyDashboardState />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {widgetOrder.map((widgetId) => {
              switch (widgetId) {
                case "executiveOverview":
                  return data.widgets.executiveOverview ? (
                    <ExecutiveOverviewWidget
                      key={widgetId}
                      departmentPerformance={data.widgets.executiveOverview.departmentPerformance}
                      quickActions={data.widgets.executiveOverview.quickActions}
                      canAccess={canAccess}
                    />
                  ) : null;
                case "departmentOverview":
                  return data.widgets.departmentOverview ? (
                    <DepartmentOverviewWidget
                      key={widgetId}
                      departmentName={data.widgets.departmentOverview.departmentName}
                      employeeDistribution={data.widgets.departmentOverview.employeeDistribution}
                      quickActions={data.widgets.departmentOverview.quickActions}
                      readOnly={isEmployeeReadOnly}
                      canAccess={canAccess}
                    />
                  ) : null;
                case "strategicCycles":
                  return (
                    <StrategicCyclesWidget
                      key={widgetId}
                      cycles={data.widgets.strategicCycles}
                    />
                  );
                case "objectives":
                  return (
                    <ObjectivesWidget
                      key={widgetId}
                      objectives={data.widgets.objectives}
                    />
                  );
                case "okrProgress":
                  return (
                    <OKRProgressWidget
                      key={widgetId}
                      okrs={data.widgets.okrProgress}
                      title={data.role === "EMPLOYEE" ? "Meus OKRs" : "Progresso dos OKRs"}
                    />
                  );
                case "teamMembers":
                  return (
                    <TeamMembersWidget
                      key={widgetId}
                      members={data.widgets.teamMembers}
                    />
                  );
                case "riskAlerts":
                  return (
                    <RiskAlertsWidget
                      key={widgetId}
                      alerts={data.widgets.riskAlerts}
                    />
                  );
                case "recentUpdates":
                  return (
                    <RecentUpdatesWidget
                      key={widgetId}
                      updates={data.widgets.recentUpdates}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
