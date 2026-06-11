import type { ObjectivePriority } from "../types/objectives.types";

type ObjectivePriorityBadgeProps = {
  priority: ObjectivePriority;
};

const priorityConfig: Record<ObjectivePriority, { label: string; className: string }> = {
  HIGH: {
    label: "Alta",
    className: "bg-[#FEE2E2] text-[#B91C1C] dark:bg-red-950/60 dark:text-red-200",
  },
  MEDIUM: {
    label: "Média",
    className: "bg-[#FEF3C7] text-[#92400E] dark:bg-amber-950/60 dark:text-amber-200",
  },
  LOW: {
    label: "Baixa",
    className: "bg-[#DCFCE7] text-[#166534] dark:bg-emerald-950/60 dark:text-emerald-200",
  },
  UNSPECIFIED: {
    label: "Não definida",
    className: "bg-[#F3F4F6] text-[#4B5563] dark:bg-slate-800 dark:text-slate-300",
  },
};

export function ObjectivePriorityBadge({ priority }: ObjectivePriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
