import { Eye, PencilLine, Trash2 } from "lucide-react";
import type { DepartmentListItem } from "../types/departments.types";

type DepartmentActionsProps = {
  department: DepartmentListItem;
  canManage: boolean;
  busy?: boolean;
  onView: (department: DepartmentListItem) => void;
  onEdit: (department: DepartmentListItem) => void;
  onDelete: (department: DepartmentListItem) => void;
};

export function DepartmentActions({
  department,
  canManage,
  busy = false,
  onView,
  onEdit,
  onDelete,
}: DepartmentActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onView(department)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#1F2937] transition-colors hover:bg-[#F8FAFC]"
      >
        <Eye className="h-4 w-4" />
        Ver
      </button>

      {canManage ? (
        <button
          type="button"
          onClick={() => onEdit(department)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#1E4E79] transition-colors hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PencilLine className="h-4 w-4" />
          Editar
        </button>
      ) : null}

      {canManage ? (
        <button
          type="button"
          onClick={() => onDelete(department)}
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
