import { DashboardCard } from "../../dashboard/components/DashboardCard";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { ProgressIndicator } from "../../dashboard/components/ProgressIndicator";
import { StrategicCycleActions } from "./StrategicCycleActions";
import { StrategicCycleStatusBadge } from "./StrategicCycleStatusBadge";
import type { StrategicCycleItem } from "../types/strategic-cycles.types";

type StrategicCyclesTableProps = {
  cycles: StrategicCycleItem[];
  canManage: boolean;
  busyCycleId?: string | null;
  onView: (cycle: StrategicCycleItem) => void;
  onEdit: (cycle: StrategicCycleItem) => void;
  onClose: (cycle: StrategicCycleItem) => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function getProgressTone(progress: number) {
  if (progress >= 70) {
    return "success";
  }

  if (progress >= 40) {
    return "warning";
  }

  return "danger";
}

export function StrategicCyclesTable({
  cycles,
  canManage,
  busyCycleId,
  onView,
  onEdit,
  onClose,
}: StrategicCyclesTableProps) {
  return (
    <DashboardCard
      title="Mapa de ciclos"
      subtitle="Visão consolidada dos ciclos estratégicos dentro do seu escopo atual."
    >
      {cycles.length === 0 ? (
        <EmptyDashboardState
          title="Nenhum ciclo encontrado"
          description="Ajuste os filtros ou cadastre um novo ciclo para começar a acompanhar a estratégia."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                <th className="pb-4 pr-4">Ciclo</th>
                <th className="pb-4 pr-4">Departamento</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 pr-4">Período</th>
                <th className="pb-4 pr-4">Progresso</th>
                <th className="pb-4 pr-4">Objetivos</th>
                <th className="pb-4 pr-4">OKRs</th>
                <th className="pb-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {cycles.map((cycle) => (
                <tr key={cycle.id} className="align-top">
                  <td className="py-5 pr-4">
                    <p className="font-semibold text-[#1F2937]">{cycle.name}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {cycle.ownerNames.length > 0
                        ? `Responsáveis: ${cycle.ownerNames.join(", ")}`
                        : "Sem responsáveis vinculados"}
                    </p>
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">{cycle.departmentName}</td>
                  <td className="py-5 pr-4">
                    <StrategicCycleStatusBadge status={cycle.status} />
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">
                    {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                  </td>
                  <td className="min-w-40 py-5 pr-4">
                    <ProgressIndicator
                      value={cycle.progress}
                      tone={getProgressTone(cycle.progress)}
                    />
                  </td>
                  <td className="py-5 pr-4 text-sm font-medium text-[#1F2937]">
                    {cycle.objectivesCount}
                  </td>
                  <td className="py-5 pr-4 text-sm font-medium text-[#1F2937]">
                    {cycle.okrsCount}
                  </td>
                  <td className="py-5 text-right">
                    <StrategicCycleActions
                      cycle={cycle}
                      canManage={canManage}
                      busy={busyCycleId === cycle.id}
                      onView={onView}
                      onEdit={onEdit}
                      onClose={onClose}
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
