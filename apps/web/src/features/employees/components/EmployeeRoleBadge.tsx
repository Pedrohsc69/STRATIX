import { Shield, UserCog, UserRound } from "lucide-react";
import type { DashboardRole } from "../../dashboard/dashboard.types";

type EmployeeRoleBadgeProps = {
  role: DashboardRole;
};

export function EmployeeRoleBadge({ role }: EmployeeRoleBadgeProps) {
  const config =
    role === "DIRECTOR"
      ? {
          label: "Diretor",
          icon: Shield,
          tone: "bg-[#0F2A44] text-white",
        }
      : role === "MANAGER"
        ? {
            label: "Gestor",
            icon: UserCog,
            tone: "bg-[#DBEAFE] text-[#1E4E79]",
          }
        : {
            label: "Colaborador",
            icon: UserRound,
            tone: "bg-[#F3F4F6] text-[#4B5563]",
          };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${config.tone}`}
    >
      <config.icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
