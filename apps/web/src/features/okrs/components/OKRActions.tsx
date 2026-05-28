import { ChartNoAxesColumnIncreasing, Eye, PencilLine, Trash2 } from "lucide-react";
import type { OkrItem } from "../types/okrs.types";

type OKRActionsProps = {
  okr: OkrItem;
  canEdit: boolean;
  canDelete: boolean;
  canUpdateProgress: boolean;
  busy?: boolean;
  onView: (okr: OkrItem) => void;
  onEdit: (okr: OkrItem) => void;
  onDelete: (okr: OkrItem) => void;
  onProgress: (okr: OkrItem) => void;
};

export function OKRActions({
  okr,
  canEdit,
  canDelete,
  canUpdateProgress,
  busy = false,
  onView,
  onEdit,
  onDelete,
  onProgress,
}: OKRActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onView(okr)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#1F2937] transition-colors hover:bg-[#F8FAFC]"
      >
        <Eye className="h-4 w-4" />
        Ver
      </button>

      {canUpdateProgress ? (
        <button
          type="button"
          onClick={() => onProgress(okr)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#0F2A44] transition-colors hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ChartNoAxesColumnIncreasing className="h-4 w-4" />
          Progresso
        </button>
      ) : null}

      {canEdit ? (
        <button
          type="button"
          onClick={() => onEdit(okr)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#1E4E79] transition-colors hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PencilLine className="h-4 w-4" />
          Editar
        </button>
      ) : null}

      {canDelete ? (
        <button
          type="button"
          onClick={() => onDelete(okr)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F2A44] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#143757] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </button>
      ) : null}
    </div>
  );
}
