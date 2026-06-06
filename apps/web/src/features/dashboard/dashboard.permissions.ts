import type { SessionUser } from "../../store/app-store";
import type { DashboardPermission, DashboardRole } from "./dashboard.types";

export const rolePermissions: Record<DashboardRole, DashboardPermission[]> = {
  DIRECTOR: [
    "dashboard:view:company",
    "departments:manage",
    "users:manage",
    "cycles:manage",
    "objectives:manage",
    "okrs:manage",
    "reports:export",
    "settings:view:self",
    "settings:manage:company",
  ],
  MANAGER: [
    "dashboard:view:department",
    "departments:view:department",
    "users:view:department",
    "cycles:view:department",
    "objectives:manage:department",
    "okrs:manage:department",
    "settings:view:self",
  ],
  EMPLOYEE: [
    "dashboard:view:department:readonly",
    "departments:view:department:readonly",
    "cycles:view:department",
    "objectives:view:department",
    "okrs:update:own",
    "okrs:view:own",
    "settings:view:self",
  ],
};

export function getPermissionsByRole(role: DashboardRole) {
  return rolePermissions[role];
}

export function canAccess(
  permissions: DashboardPermission[],
  required: DashboardPermission | DashboardPermission[],
) {
  const requiredPermissions = Array.isArray(required) ? required : [required];
  return requiredPermissions.every((permission) => permissions.includes(permission));
}

export function getRoleFromSession(user?: SessionUser | null): DashboardRole | null {
  return user?.role ?? null;
}
