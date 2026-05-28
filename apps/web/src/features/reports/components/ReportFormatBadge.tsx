import type { ReportFormat } from "../types/reports.types";

type ReportFormatBadgeProps = {
  format: ReportFormat;
};

export function ReportFormatBadge({ format }: ReportFormatBadgeProps) {
  return (
    <span className="inline-flex rounded-full bg-[#E0F2FE] px-3 py-1 text-xs font-semibold uppercase text-[#0F2A44]">
      {format}
    </span>
  );
}
