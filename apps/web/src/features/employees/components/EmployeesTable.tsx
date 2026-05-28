import { DashboardCard } from "../../dashboard/components/DashboardCard";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { EmployeeActions } from "./EmployeeActions";
import { EmployeeRoleBadge } from "./EmployeeRoleBadge";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";
import { InviteStatusBadge } from "./InviteStatusBadge";
import type { EmployeeListItem } from "../types/employees.types";

type EmployeesTableProps = {
  employees: EmployeeListItem[];
  canManage: boolean;
  busyEmployeeId?: string | null;
  onView: (employee: EmployeeListItem) => void;
  onResend: (employee: EmployeeListItem) => void;
};

function getInitials(name: string | null, email: string) {
  if (name?.trim()) {
    return name
      .split(" ")
      .map((value) => value[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) {
    return "Convite pendente";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function EmployeesTable({
  employees,
  canManage,
  busyEmployeeId,
  onView,
  onResend,
}: EmployeesTableProps) {
  return (
    <DashboardCard
      title="Equipe"
      subtitle="Visão consolidada de usuários ativos, gestores e convites pendentes no escopo permitido."
    >
      {employees.length === 0 ? (
        <EmptyDashboardState
          title="Nenhum funcionário encontrado"
          description="Ajuste os filtros para encontrar pessoas ou convites pendentes no escopo atual."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                <th className="pb-4 pr-4">Pessoa</th>
                <th className="pb-4 pr-4">Função</th>
                <th className="pb-4 pr-4">Departamento</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 pr-4">Entrada</th>
                <th className="pb-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {employees.map((employee) => (
                <tr key={`${employee.kind}-${employee.id}`} className="align-top">
                  <td className="py-5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E0F2FE] text-sm font-semibold text-[#0F2A44]">
                        {getInitials(employee.name, employee.email)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1F2937]">
                          {employee.name ?? "Convite pendente"}
                        </p>
                        <p className="mt-1 text-sm text-[#6B7280]">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 pr-4">
                    <EmployeeRoleBadge role={employee.role} />
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">
                    {employee.department?.name ?? "Sem departamento"}
                  </td>
                  <td className="py-5 pr-4">
                    {employee.kind === "INVITE" ? (
                      <InviteStatusBadge
                        status={employee.status === "EXPIRED" ? "EXPIRED" : "PENDING"}
                      />
                    ) : (
                      <EmployeeStatusBadge status={employee.status} />
                    )}
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#6B7280]">
                    {formatDate(employee.joinedAt ?? employee.createdAt)}
                  </td>
                  <td className="py-5 text-right">
                    <EmployeeActions
                      employee={employee}
                      canManage={canManage}
                      busy={busyEmployeeId === employee.id}
                      onView={onView}
                      onResend={onResend}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
