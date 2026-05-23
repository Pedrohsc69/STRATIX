import { canAccess } from "../dashboard.permissions";
import type { DashboardPermission, DashboardResponse, DashboardWidgetId } from "../dashboard.types";

export function getDashboardWidgetsByRole(
  dashboard: DashboardResponse,
  permissions: DashboardPermission[],
) {
  const widgets: DashboardWidgetId[] = [];

  if (dashboard.widgets.executiveOverview && canAccess(permissions, "dashboard:view:company")) {
    widgets.push("executiveOverview");
  }

  if (
    dashboard.widgets.departmentOverview &&
    (canAccess(permissions, "dashboard:view:department") ||
      canAccess(permissions, "dashboard:view:department:readonly"))
  ) {
    widgets.push("departmentOverview");
  }

  if (dashboard.widgets.strategicCycles.length > 0) {
    widgets.push("strategicCycles");
  }

  if (dashboard.widgets.objectives.length > 0) {
    widgets.push("objectives");
  }

  if (dashboard.widgets.okrProgress.length > 0) {
    widgets.push("okrProgress");
  }

  if (dashboard.widgets.teamMembers.length > 0) {
    widgets.push("teamMembers");
  }

  if (dashboard.widgets.riskAlerts.length > 0) {
    widgets.push("riskAlerts");
  }

  if (dashboard.widgets.recentUpdates.length > 0) {
    widgets.push("recentUpdates");
  }

  return widgets;
}
