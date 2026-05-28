import { DashboardCard } from "../../dashboard/components/DashboardCard";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { ReportFormatBadge } from "./ReportFormatBadge";
import type { RecentReportItem } from "../types/reports.types";

type RecentReportsTableProps = {
  reports: RecentReportItem[];
};

function getTypeLabel(type: RecentReportItem["type"]) {
  if (type === "COMPANY") {
    return "Empresa";
  }

  if (type === "CYCLE") {
    return "Ciclo";
  }

  return "Departamento";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RecentReportsTable({ reports }: RecentReportsTableProps) {
  return (
    <DashboardCard
      title="Exportações recentes"
      subtitle="O histórico persistido ainda não existe. Os downloads gerados nesta sessão aparecem aqui."
    >
      {reports.length === 0 ? (
        <EmptyDashboardState
          title="Nenhuma exportação nesta sessão"
          description="Gere um relatório para começar a acompanhar os arquivos baixados agora."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                <th className="pb-4 pr-4">Relatório</th>
                <th className="pb-4 pr-4">Tipo</th>
                <th className="pb-4 pr-4">Formato</th>
                <th className="pb-4 pr-4">Gerado em</th>
                <th className="pb-4 pr-4">Arquivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="py-5 pr-4 font-semibold text-[#1F2937]">{report.label}</td>
                  <td className="py-5 pr-4 text-sm text-[#1F2937]">{getTypeLabel(report.type)}</td>
                  <td className="py-5 pr-4">
                    <ReportFormatBadge format={report.format} />
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#6B7280]">
                    {formatDateTime(report.generatedAt)}
                  </td>
                  <td className="py-5 pr-4 text-sm text-[#6B7280]">{report.filename}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
