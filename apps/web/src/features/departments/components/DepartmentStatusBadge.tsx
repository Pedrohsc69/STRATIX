import type { DepartmentStatus } from "../types/departments.types";

type DepartmentStatusBadgeProps = {
  status: DepartmentStatus;
};

const statusConfig = {
  ON_TRACK: {
    label: "Saudável",
    className: "bg-[#DCFCE7] text-[#166534]",
  },
  ATTENTION: {
    label: "Atenção",
    className: "bg-[#FEF3C7] text-[#92400E]",
  },
  AT_RISK: {
    label: "Em risco",
    className: "bg-[#FEE2E2] text-[#991B1B]",
  },
  NO_DATA: {
    label: "Sem dados",
    className: "bg-[#E5E7EB] text-[#4B5563]",
  },
} as const;

export function DepartmentStatusBadge({ status }: DepartmentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
