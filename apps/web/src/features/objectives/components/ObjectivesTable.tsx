import { DashboardCard } from '../../dashboard/components/DashboardCard';
import { EmptyDashboardState } from '../../dashboard/components/EmptyDashboardState';
import { ProgressIndicator } from '../../dashboard/components/ProgressIndicator';
import { ObjectiveActions } from './ObjectiveActions';
import { ObjectivePriorityBadge } from './ObjectivePriorityBadge';
import { ObjectiveStatusBadge } from './ObjectiveStatusBadge';
import type { ObjectiveItem } from '../types/objectives.types';

type ObjectivesTableProps = {
  objectives: ObjectiveItem[];
  canEdit: (objective: ObjectiveItem) => boolean;
  canDelete: (objective: ObjectiveItem) => boolean;
  busyObjectiveId?: string | null;
  onView: (objective: ObjectiveItem) => void;
  onEdit: (objective: ObjectiveItem) => void;
  onDelete: (objective: ObjectiveItem) => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

function getProgressTone(progress: number) {
  if (progress >= 70) {
    return 'success';
  }

  if (progress >= 40) {
    return 'warning';
  }

  return 'danger';
}

export function ObjectivesTable({
  objectives,
  canEdit,
  canDelete,
  busyObjectiveId,
  onView,
  onEdit,
  onDelete,
}: ObjectivesTableProps) {
  return (
    <DashboardCard
      title="Portfólio de objetivos"
      subtitle="Panorama consolidado dos objetivos estratégicos dentro do seu escopo."
    >
      {objectives.length === 0 ? (
        <EmptyDashboardState
          title="Nenhum objetivo encontrado"
          description="Ajuste os filtros ou cadastre um novo objetivo para estruturar a execução da estratégia."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                <th className="pb-4 pr-4">Objetivo</th>
                <th className="pb-4 pr-4">Ciclo</th>
                <th className="pb-4 pr-4">Departamento</th>
                <th className="pb-4 pr-4">Prioridade</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 pr-4">Período</th>
                <th className="pb-4 pr-4">Progresso</th>
                <th className="pb-4 pr-4">OKRs</th>
                <th className="pb-4 pr-4">Responsáveis</th>
                <th className="pb-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {objectives.map((objective) => (
                <tr key={objective.id} className="align-top">
                  <td className="py-5 pr-4">
                    <p className="font-semibold text-[#1F2937]">{objective.name}</p>
                    <p className="mt-1 text-sm text-[#6B7280] line-clamp-2">
                      {objective.description}
                    </p>
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">{objective.cycleName}</td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">{objective.departmentName}</td>
                  <td className="py-5 pr-4">
                    <ObjectivePriorityBadge priority={objective.priority} />
                  </td>
                  <td className="py-5 pr-4">
                    <ObjectiveStatusBadge status={objective.status} />
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">
                    {formatDate(objective.period.startDate)} -{' '}
                    {formatDate(objective.period.endDate)}
                  </td>
                  <td className="min-w-40 py-5 pr-4">
                    <ProgressIndicator
                      value={objective.progress}
                      tone={getProgressTone(objective.progress)}
                    />
                  </td>
                  <td className="py-5 pr-4 text-sm font-medium text-[#1F2937]">
                    {objective.okrsCount}
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">
                    {objective.ownerNames.length > 0
                      ? objective.ownerNames.join(', ')
                      : 'Sem responsáveis'}
                  </td>
                  <td className="py-5 text-right">
                    <ObjectiveActions
                      objective={objective}
                      canEdit={canEdit(objective)}
                      canDelete={canDelete(objective)}
                      busy={busyObjectiveId === objective.id}
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
