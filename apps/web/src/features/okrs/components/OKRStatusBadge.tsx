import type { OkrStatus } from "../types/okrs.types";

type OKRStatusBadgeProps = {
  status: OkrStatus;
};

const statusConfig: Record<OkrStatus, { label: string; className: string }> = {
  IN_PROGRESS: {
    label: "Em andamento",
    className: "bg-[#DBEAFE] text-[#1E4E79]",
  },
  COMPLETED: {
    label: "Concluído",
    className: "bg-[#DCFCE7] text-[#166534]",
  },
  AT_RISK: {
    label: "Em risco",
    className: "bg-[#FEE2E2] text-[#B91C1C]",
  },
};

export function OKRStatusBadge({ status }: OKRStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
