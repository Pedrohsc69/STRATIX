import { getSession } from "../../../store/app-store";
import { canAccess, getPermissionsByRole } from "../dashboard.permissions";
import type { DashboardPermission } from "../dashboard.types";

export function useDashboardScope(permissionsFromApi?: DashboardPermission[]) {
  const session = getSession();
  const role = session?.user.role ?? null;
  const permissions =
    permissionsFromApi && permissionsFromApi.length > 0 && role
      ? permissionsFromApi
      : role
      ? getPermissionsByRole(role)
      : [];

  return {
    session,
    role,
    permissions,
    canAccess: (required: DashboardPermission | DashboardPermission[]) =>
      canAccess(permissions, required),
  };
}
