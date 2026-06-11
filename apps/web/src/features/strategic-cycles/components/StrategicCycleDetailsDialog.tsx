import { X } from 'lucide-react';
import { ProgressIndicator } from '../../dashboard/components/ProgressIndicator';
import { StrategicCycleStatusBadge } from './StrategicCycleStatusBadge';
import type { StrategicCycleItem } from '../types/strategic-cycles.types';

type StrategicCycleDetailsDialogProps = {
  cycle: StrategicCycleItem;
  onClose: () => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

export function StrategicCycleDetailsDialog({ cycle, onClose }: StrategicCycleDetailsDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">Detalhes do ciclo</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">{cycle.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 p-2 text-[#6B7280] transition-colors hover:bg-[#F8FAFC]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pt-6">
          {cycle.status === 'CLOSED' ? (
            <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1E3A8A]">
              Ciclo encerrado — dados disponíveis apenas para consulta.
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Departamento</p>
              <p className="mt-1 font-medium text-[#1F2937]">{cycle.departmentName}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Período</p>
              <p className="mt-1 font-medium text-[#1F2937]">
                {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Status</p>
              <div className="mt-2">
                <StrategicCycleStatusBadge status={cycle.status} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Objetivos vinculados</p>
              <p className="mt-1 font-medium text-[#1F2937]">{cycle.objectivesCount}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">OKRs vinculados</p>
              <p className="mt-1 font-medium text-[#1F2937]">{cycle.okrsCount}</p>
            </div>
            <div>
              <p className="mb-2 text-sm text-[#6B7280]">Progresso consolidado</p>
              <ProgressIndicator value={cycle.progress} tone="brand" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-t border-gray-200 px-6 py-6 md:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-3 text-sm font-medium text-[#1F2937]">Objetivos</p>
            <div className="space-y-2">
              {cycle.objectiveNames.length > 0 ? (
                cycle.objectiveNames.map((objectiveName) => (
                  <div
                    key={objectiveName}
                    className="break-words rounded-xl bg-[#F8FAFC] px-4 py-3 text-sm text-[#1F2937]"
                  >
                    {objectiveName}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">Nenhum objetivo vinculado.</p>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <p className="mb-3 text-sm font-medium text-[#1F2937]">Responsáveis pelos OKRs</p>
            <div className="space-y-2">
              {cycle.ownerNames.length > 0 ? (
                cycle.ownerNames.map((ownerName) => (
                  <div
                    key={ownerName}
                    className="break-words rounded-xl bg-[#F8FAFC] px-4 py-3 text-sm text-[#1F2937]"
                  >
                    {ownerName}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">
                  Nenhum responsável vinculado aos OKRs deste ciclo.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
