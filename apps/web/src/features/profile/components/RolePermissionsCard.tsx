import { KeyRound } from "lucide-react";
import { DashboardCard } from "../../dashboard/components/DashboardCard";
import type { DashboardPermission } from "../../dashboard/dashboard.types";

type RolePermissionsCardProps = {
  permissions: DashboardPermission[];
};

const permissionLabels: Record<DashboardPermission, string> = {
  "dashboard:view:company": "Dashboard corporativo",
  "dashboard:view:department": "Dashboard departamental",
  "dashboard:view:department:readonly": "Dashboard leitura",
  "departments:manage": "Gerenciar departamentos",
  "departments:view:department": "Ver departamento",
  "departments:view:department:readonly": "Ver departamento em leitura",
  "users:manage": "Gerenciar funcionários",
  "users:view:department": "Ver funcionários do departamento",
  "cycles:manage": "Gerenciar ciclos",
  "cycles:manage:department": "Gerenciar ciclos do departamento",
  "cycles:view:department": "Ver ciclos do departamento",
  "objectives:manage": "Gerenciar objetivos",
  "objectives:manage:department": "Gerenciar objetivos do departamento",
  "objectives:view:department": "Ver objetivos do departamento",
  "okrs:manage": "Gerenciar OKRs",
  "okrs:manage:department": "Gerenciar OKRs do departamento",
  "okrs:update:own": "Atualizar próprios OKRs",
  "okrs:view:own": "Ver próprios OKRs",
  "reports:export": "Exportar relatórios",
  "reports:export:department": "Exportar relatórios do departamento",
  "settings:view:self": "Gerenciar preferências pessoais",
  "settings:manage:company": "Gerenciar configurações da empresa",
};

export function RolePermissionsCard({ permissions }: RolePermissionsCardProps) {
  return (
    <DashboardCard
      title="Permissões ativas"
      subtitle="Escopo operacional liberado para o seu papel dentro do STRATIX."
    >
      <div className="flex flex-wrap gap-3">
        {permissions.map((permission) => (
          <div
            key={permission}
            className="inline-flex items-center gap-2 rounded-full border border-[#D6E4F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#1F2937]"
          >
            <KeyRound className="h-4 w-4 text-[#1E4E79]" />
            <span>{permissionLabels[permission]}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
