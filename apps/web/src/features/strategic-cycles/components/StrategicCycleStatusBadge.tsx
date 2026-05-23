import type { StrategicCycleStatus } from "../types/strategic-cycles.types";

type StrategicCycleStatusBadgeProps = {
  status: StrategicCycleStatus;
};

const statusConfig: Record<
  StrategicCycleStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Em andamento",
    className: "bg-[#DBEAFE] text-[#1E4E79]",
  },
  CLOSED: {
    label: "Concluído",
    className: "bg-[#DCFCE7] text-[#166534]",
  },
  DELAYED: {
    label: "Atrasado",
    className: "bg-[#FEE2E2] text-[#B91C1C]",
  },
};

export function StrategicCycleStatusBadge({
  status,
}: StrategicCycleStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
