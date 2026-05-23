import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getSession, isAuthenticated } from "../../store/app-store";
import { canAccess, getPermissionsByRole } from "../../features/dashboard/dashboard.permissions";
import type { DashboardPermission, DashboardRole } from "../../features/dashboard/dashboard.types";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: DashboardRole[];
  requiredPermissions?: DashboardPermission[];
};

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermissions,
}: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  if (
    requiredPermissions &&
    !canAccess(getPermissionsByRole(session.user.role), requiredPermissions)
  ) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
