import { Eye, PencilLine, Trash2 } from "lucide-react";
import type { ObjectiveItem } from "../types/objectives.types";

type ObjectiveActionsProps = {
  objective: ObjectiveItem;
  canEdit: boolean;
  canDelete: boolean;
  busy?: boolean;
  onView: (objective: ObjectiveItem) => void;
  onEdit: (objective: ObjectiveItem) => void;
  onDelete: (objective: ObjectiveItem) => void;
};

export function ObjectiveActions({
  objective,
  canEdit,
  canDelete,
  busy = false,
  onView,
  onEdit,
  onDelete,
}: ObjectiveActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onView(objective)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#1F2937] transition-colors hover:bg-[#F8FAFC]"
      >
        <Eye className="h-4 w-4" />
        Ver
      </button>

      {canEdit ? (
        <button
          type="button"
          onClick={() => onEdit(objective)}
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
          onClick={() => onDelete(objective)}
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
