import { X } from "lucide-react";
import { ProgressIndicator } from "../../dashboard/components/ProgressIndicator";
import { ObjectivePriorityBadge } from "./ObjectivePriorityBadge";
import { ObjectiveStatusBadge } from "./ObjectiveStatusBadge";
import type { ObjectiveItem } from "../types/objectives.types";

type ObjectiveDetailsDialogProps = {
  objective: ObjectiveItem;
  onClose: () => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function ObjectiveDetailsDialog({
  objective,
  onClose,
}: ObjectiveDetailsDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">Detalhes do objetivo</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">{objective.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 p-2 text-[#6B7280] transition-colors hover:bg-[#F8FAFC]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Ciclo estratégico</p>
              <p className="mt-1 font-medium text-[#1F2937]">{objective.cycleName}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Departamento</p>
              <p className="mt-1 font-medium text-[#1F2937]">{objective.departmentName}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Descrição</p>
              <p className="mt-1 text-sm text-[#1F2937]">{objective.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <ObjectiveStatusBadge status={objective.status} />
              <ObjectivePriorityBadge priority={objective.priority} />
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Período do ciclo</p>
              <p className="mt-1 font-medium text-[#1F2937]">
                {formatDate(objective.period.startDate)} - {formatDate(objective.period.endDate)}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm text-[#6B7280]">Progresso consolidado</p>
              <ProgressIndicator value={objective.progress} tone="brand" />
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">OKRs vinculados</p>
              <p className="mt-1 font-medium text-[#1F2937]">{objective.okrsCount}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-6">
          <p className="mb-3 text-sm font-medium text-[#1F2937]">Responsáveis relacionados</p>
          <div className="flex flex-wrap gap-2">
            {objective.ownerNames.length > 0 ? (
              objective.ownerNames.map((ownerName) => (
                <span
                  key={ownerName}
                  className="rounded-full bg-[#F8FAFC] px-4 py-2 text-sm text-[#1F2937]"
                >
                  {ownerName}
                </span>
              ))
            ) : (
              <p className="text-sm text-[#6B7280]">Nenhum responsável relacionado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
