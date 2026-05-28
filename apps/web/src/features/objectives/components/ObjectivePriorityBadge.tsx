import type { ObjectivePriority } from "../types/objectives.types";

type ObjectivePriorityBadgeProps = {
  priority: ObjectivePriority;
};

const priorityConfig: Record<ObjectivePriority, { label: string; className: string }> = {
  UNSPECIFIED: {
    label: "Não definida",
    className: "bg-[#F3F4F6] text-[#4B5563]",
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
