import type { ReportFormat } from "../types/reports.types";

type ReportFormatBadgeProps = {
  format: ReportFormat;
};

export function ReportFormatBadge({ format }: ReportFormatBadgeProps) {
  const tone =
    format === "pdf"
      ? "bg-[#DCFCE7] text-[#166534]"
      : "bg-[#E0F2FE] text-[#0F2A44]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${tone}`}>
      {format}
    </span>
  );
}
