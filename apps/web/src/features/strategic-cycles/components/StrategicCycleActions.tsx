import { CircleStop, Eye, PencilLine } from 'lucide-react';
import type { StrategicCycleItem } from '../types/strategic-cycles.types';

type StrategicCycleActionsProps = {
  cycle: StrategicCycleItem;
  canEdit: boolean;
  canClose: boolean;
  busy?: boolean;
  onView: (cycle: StrategicCycleItem) => void;
  onEdit: (cycle: StrategicCycleItem) => void;
  onClose: (cycle: StrategicCycleItem) => void;
};

export function StrategicCycleActions({
  cycle,
  canEdit,
  canClose,
  busy = false,
  onView,
  onEdit,
  onClose,
}: StrategicCycleActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onView(cycle)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#1F2937] transition-colors hover:bg-[#F8FAFC]"
      >
        <Eye className="h-4 w-4" />
        Ver
      </button>

      {canEdit || canClose ? (
        <>
          {canEdit && cycle.status !== 'CLOSED' ? (
            <button
              type="button"
              onClick={() => onEdit(cycle)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#1E4E79] transition-colors hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PencilLine className="h-4 w-4" />
              Editar
            </button>
          ) : null}

          {canClose && cycle.status !== 'CLOSED' ? (
            <button
              type="button"
              onClick={() => onClose(cycle)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F2A44] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#143757] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CircleStop className="h-4 w-4" />
              Encerrar
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
