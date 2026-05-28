import { DashboardCard } from "../../dashboard/components/DashboardCard";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { ProgressIndicator } from "../../dashboard/components/ProgressIndicator";
import { DepartmentActions } from "./DepartmentActions";
import { DepartmentStatusBadge } from "./DepartmentStatusBadge";
import type { DepartmentListItem } from "../types/departments.types";

type DepartmentsTableProps = {
  departments: DepartmentListItem[];
  canManage: boolean;
  busyDepartmentId?: string | null;
  onView: (department: DepartmentListItem) => void;
  onEdit: (department: DepartmentListItem) => void;
  onDelete: (department: DepartmentListItem) => void;
};

function getProgressTone(progress: number) {
  if (progress >= 70) {
    return "success";
  }

  if (progress >= 40) {
    return "warning";
  }

  return "danger";
}

export function DepartmentsTable({
  departments,
  canManage,
  busyDepartmentId,
  onView,
  onEdit,
  onDelete,
}: DepartmentsTableProps) {
  return (
    <DashboardCard
      title="Mapa de departamentos"
      subtitle="Estrutura organizacional com indicadores de pessoas, ciclos e execução estratégica."
    >
      {departments.length === 0 ? (
        <EmptyDashboardState
          title="Nenhum departamento encontrado"
          description="Ajuste os filtros ou cadastre um novo departamento para organizar a operação."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                <th className="pb-4 pr-4">Departamento</th>
                <th className="pb-4 pr-4">Gestor</th>
                <th className="pb-4 pr-4">Colaboradores</th>
                <th className="pb-4 pr-4">Ciclos</th>
                <th className="pb-4 pr-4">Objetivos</th>
                <th className="pb-4 pr-4">OKRs</th>
                <th className="pb-4 pr-4">Progresso</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {departments.map((department) => (
                <tr key={department.id} className="align-top">
                  <td className="py-5 pr-4">
                    <p className="font-semibold text-[#1F2937]">{department.name}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {department.cyclesCount > 0
                        ? `${department.cyclesCount} ciclos no escopo atual`
                        : "Sem ciclos vinculados"}
                    </p>
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">
                    {department.manager?.name ?? "Sem gestor atribuído"}
                  </td>
                  <td className="py-5 pr-4 text-sm font-medium text-[#1F2937]">
                    {department.collaboratorsCount}
                  </td>
                  <td className="py-5 pr-4 text-sm font-medium text-[#1F2937]">
                    {department.cyclesCount}
                  </td>
                  <td className="py-5 pr-4 text-sm font-medium text-[#1F2937]">
                    {department.objectivesCount}
                  </td>
                  <td className="py-5 pr-4 text-sm font-medium text-[#1F2937]">
                    {department.okrsCount}
                  </td>
                  <td className="min-w-40 py-5 pr-4">
                    <ProgressIndicator
                      value={department.averageProgress}
                      tone={getProgressTone(department.averageProgress)}
                    />
                  </td>
                  <td className="py-5 pr-4">
                    <DepartmentStatusBadge status={department.status} />
                  </td>
                  <td className="py-5 text-right">
                    <DepartmentActions
                      department={department}
                      canManage={canManage}
                      busy={busyDepartmentId === department.id}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
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
