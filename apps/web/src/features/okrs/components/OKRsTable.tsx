import { DashboardCard } from "../../dashboard/components/DashboardCard";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { ProgressIndicator } from "../../dashboard/components/ProgressIndicator";
import { OKRActions } from "./OKRActions";
import { OKRStatusBadge } from "./OKRStatusBadge";
import type { OkrItem } from "../types/okrs.types";
import {
  formatOkrProgress,
  formatOkrValue,
  getMetricTypeLabel,
} from "../utils/okr-formatters";

type OKRsTableProps = {
  okrs: OkrItem[];
  canEdit: (okr: OkrItem) => boolean;
  canDelete: (okr: OkrItem) => boolean;
  canUpdateProgress: (okr: OkrItem) => boolean;
  busyOkrId?: string | null;
  onView: (okr: OkrItem) => void;
  onEdit: (okr: OkrItem) => void;
  onDelete: (okr: OkrItem) => void;
  onProgress: (okr: OkrItem) => void;
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

export function OKRsTable({
  okrs,
  canEdit,
  canDelete,
  canUpdateProgress,
  busyOkrId,
  onView,
  onEdit,
  onDelete,
  onProgress,
}: OKRsTableProps) {
  return (
    <DashboardCard
      title="Portfólio de OKRs"
      subtitle="Acompanhamento operacional dos indicadores-chave dentro do seu escopo."
    >
      {okrs.length === 0 ? (
        <EmptyDashboardState
          title="Nenhum OKR encontrado"
          description="Ajuste os filtros ou cadastre um novo OKR para acompanhar a execução da estratégia."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                <th className="pb-4 pr-4">OKR</th>
                <th className="pb-4 pr-4">Objetivo</th>
                <th className="pb-4 pr-4">Ciclo</th>
                <th className="pb-4 pr-4">Departamento</th>
                <th className="pb-4 pr-4">Responsável</th>
                <th className="pb-4 pr-4">Atual / Meta</th>
                <th className="pb-4 pr-4">Progresso</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 pr-4">Última atualização</th>
                <th className="pb-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {okrs.map((okr) => (
                <tr key={okr.id} className="align-top">
                  <td className="py-5 pr-4">
                    <p className="font-semibold text-[#1F2937]">{okr.name}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {okr.isOwnedByCurrentUser ? "Sob sua responsabilidade" : "OKR compartilhado"}
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[#1E4E79]">
                      {getMetricTypeLabel(okr.metricType)}
                    </p>
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">{okr.objectiveName}</td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">{okr.cycleName}</td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">{okr.departmentName}</td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">{okr.responsibleName}</td>
                  <td className="py-5 pr-4 text-sm font-medium text-[#1F2937]">
                    {formatOkrValue(okr.currentValue, okr.metricType)} /{" "}
                    {formatOkrValue(okr.targetValue, okr.metricType)}
                  </td>
                  <td className="min-w-40 py-5 pr-4">
                    <ProgressIndicator
                      value={okr.progress}
                      tone={getProgressTone(okr.progress)}
                      label={formatOkrProgress(okr.progress)}
                    />
                  </td>
                  <td className="py-5 pr-4">
                    <OKRStatusBadge status={okr.status} />
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">
                    {formatDate(okr.lastUpdatedAt)}
                  </td>
                  <td className="py-5 text-right">
                    <OKRActions
                      okr={okr}
                      canEdit={canEdit(okr)}
                      canDelete={canDelete(okr)}
                      canUpdateProgress={canUpdateProgress(okr)}
                      busy={busyOkrId === okr.id}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onProgress={onProgress}
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
