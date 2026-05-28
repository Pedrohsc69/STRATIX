import { Eye, Send } from "lucide-react";
import type { EmployeeListItem } from "../types/employees.types";

type EmployeeActionsProps = {
  employee: EmployeeListItem;
  canManage: boolean;
  busy?: boolean;
  onView: (employee: EmployeeListItem) => void;
  onResend: (employee: EmployeeListItem) => void;
};

export function EmployeeActions({
  employee,
  canManage,
  busy = false,
  onView,
  onResend,
}: EmployeeActionsProps) {
  if (employee.kind === "INVITE") {
    if (!canManage || !employee.canResendInvite) {
      return <span className="text-sm text-[#9CA3AF]">Sem ações</span>;
    }

    return (
      <button
        type="button"
        onClick={() => onResend(employee)}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#1E4E79] transition-colors hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        Reenviar convite
      </button>
    );
  }

  if (!employee.canViewDetails) {
    return <span className="text-sm text-[#9CA3AF]">Sem ações</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onView(employee)}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#1F2937] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Eye className="h-4 w-4" />
      Ver
    </button>
  );
}
