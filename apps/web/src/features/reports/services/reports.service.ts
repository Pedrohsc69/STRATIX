import { api } from "../../../services/api";
import type {
  ReportFormat,
  ReportsOptionsResponse,
} from "../types/reports.types";

function getFilenameFromDisposition(value?: string) {
  if (!value) {
    return null;
  }

  const match = /filename="?([^"]+)"?/.exec(value);
  return match?.[1] ?? null;
}

async function downloadReport(
  url: string,
  fallbackFilename: string,
) {
  const response = await api.get<Blob>(url, {
    responseType: "blob",
  });

  const filename =
    getFilenameFromDisposition(response.headers["content-disposition"]) ?? fallbackFilename;
  const blob = new Blob([response.data], {
    type: response.headers["content-type"] ?? "text/csv;charset=utf-8",
  });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);

  return {
    filename,
    downloadedAt: new Date().toISOString(),
  };
}

export async function fetchReportOptions() {
  const response = await api.get<ReportsOptionsResponse>("/reports/options");
  return response.data;
}

export async function exportCompanyReport(format: ReportFormat) {
  return downloadReport(
    `/reports/company/export?format=${format}`,
    `relatorio-empresa.${format}`,
  );
}

export async function exportCycleReport(cycleId: string, format: ReportFormat) {
  return downloadReport(
    `/reports/cycles/${cycleId}/export?format=${format}`,
    `relatorio-ciclo.${format}`,
  );
}

export async function exportDepartmentReport(
  departmentId: string,
  format: ReportFormat,
) {
  return downloadReport(
    `/reports/departments/${departmentId}/export?format=${format}`,
    `relatorio-departamento.${format}`,
  );
}
