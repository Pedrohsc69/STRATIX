import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../../dashboard/DashboardLayout";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { useDashboardScope } from "../../dashboard/hooks/useDashboardScope";
import { GenerateReportModal } from "../components/GenerateReportModal";
import { RecentReportsTable } from "../components/RecentReportsTable";
import { ReportCards } from "../components/ReportCards";
import { ReportFilters } from "../components/ReportFilters";
import { useReports } from "../hooks/useReports";
import {
  exportCompanyReport,
  exportCycleReport,
  exportDepartmentReport,
} from "../services/reports.service";
import type {
  RecentReportItem,
  ReportFormat,
  ReportType,
  ReportsFilters,
} from "../types/reports.types";

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white"
          />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-2xl border border-gray-200 bg-white" />
    </div>
  );
}

function getRequestErrorMessage(error: unknown) {
  const maybeError = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
  };

  if (typeof maybeError.response?.data?.message === "string") {
    return maybeError.response.data.message;
  }

  if (Array.isArray(maybeError.response?.data?.message)) {
    return maybeError.response.data.message.join(", ");
  }

  return "Não foi possível gerar o relatório.";
}

export function ReportsPage() {
  const { data, loading, error } = useReports();
  const { permissions } = useDashboardScope(data?.permissions);
  const [filters, setFilters] = useState<ReportsFilters>({
    departmentId: "",
    cycleId: "",
  });
  const [recentReports, setRecentReports] = useState<RecentReportItem[]>([]);
  const [activeType, setActiveType] = useState<ReportType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const isManager = data?.role === "MANAGER";
  const managerDepartmentId = isManager ? data?.context.department?.id ?? "" : "";
  const managerDepartmentName = isManager ? data?.context.department?.name ?? "" : "";

  useEffect(() => {
    if (!isManager || !managerDepartmentId) {
      return;
    }

    setFilters((current) => ({
      departmentId: managerDepartmentId,
      cycleId:
        current.cycleId &&
        data?.cycles.some(
          (cycle) => cycle.id === current.cycleId && cycle.departmentId === managerDepartmentId,
        )
          ? current.cycleId
          : "",
    }));
  }, [data?.cycles, isManager, managerDepartmentId]);

  const defaultCycleId = useMemo(() => {
    if (!filters.cycleId) {
      return "";
    }

    return filters.cycleId;
  }, [filters.cycleId]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-4 sm:p-6 lg:p-8">
        <LoadingState />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-4 sm:p-6 lg:p-8">
        <EmptyDashboardState
          title="Relatórios indisponíveis"
          description={error ?? "Não foi possível carregar as opções de exportação."}
        />
      </div>
    );
  }

  const availableReportTypes: ReportType[] = isManager ? ["CYCLE", "DEPARTMENT"] : ["COMPANY", "CYCLE", "DEPARTMENT"];
  const pageDescription = isManager
    ? "Relatórios do seu departamento com exportação por ciclo estratégico ou consolidado departamental."
    : "Gere exportações corporativas da empresa, por ciclo estratégico ou por departamento.";

  const handleGenerate = async (payload: {
    type: ReportType;
    format: ReportFormat;
    departmentId?: string;
    cycleId?: string;
  }) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      setFeedbackMessage(null);

      const download =
        payload.type === "COMPANY"
          ? await exportCompanyReport(payload.format)
          : payload.type === "CYCLE"
            ? await exportCycleReport(payload.cycleId ?? "", payload.format)
            : await exportDepartmentReport(payload.departmentId ?? "", payload.format);

      const label =
        payload.type === "COMPANY"
          ? "Relatório geral da empresa"
          : payload.type === "CYCLE"
            ? `Relatório do ciclo ${
                data.cycles.find((cycle) => cycle.id === payload.cycleId)?.name ?? ""
              }`
            : `Relatório do departamento ${
                data.departments.find((department) => department.id === payload.departmentId)?.name ?? ""
              }`;

      setRecentReports((current) => [
        {
          id: `${download.filename}-${download.downloadedAt}`,
          type: payload.type,
          label,
          format: payload.format,
          generatedAt: download.downloadedAt,
          filename: download.filename,
        },
        ...current,
      ]);
      setFeedbackMessage(`Relatório ${payload.format.toUpperCase()} exportado com sucesso.`);
      setActiveType(null);
    } catch (requestError) {
      setSubmitError(getRequestErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      context={data.context}
      permissions={permissions}
      role={data.role}
      pageEyebrow="Relatórios"
      pageTitle="Relatórios Estratégicos"
      pageDescription={pageDescription}
    >
      <div className="space-y-6">
        {feedbackMessage ? (
          <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-5 py-4 text-sm text-[#166534]">
            {feedbackMessage}
          </div>
        ) : null}

        <ReportCards
          availableTypes={availableReportTypes}
          onGenerate={(type) => {
            setSubmitError(null);
            setActiveType(type);
          }}
        />

        <ReportFilters
          filters={filters}
          departments={data.departments}
          cycles={data.cycles}
          departmentLocked={isManager}
          lockedDepartmentName={managerDepartmentName}
          onChange={(nextFilters) =>
            setFilters((current) => ({
              ...current,
              ...nextFilters,
            }))
          }
          onReset={() =>
            setFilters({
              departmentId: isManager ? managerDepartmentId : "",
              cycleId: "",
            })
          }
        />

        <RecentReportsTable reports={recentReports} />
      </div>

      {activeType ? (
        <GenerateReportModal
          type={activeType}
          supportedFormats={data.supportedFormats}
          departments={data.departments}
          cycles={data.cycles}
          departmentLocked={isManager}
          lockedDepartmentName={managerDepartmentName}
          defaultDepartmentId={filters.departmentId}
          defaultCycleId={defaultCycleId}
          loading={submitting}
          error={submitError}
          onClose={() => {
            setActiveType(null);
            setSubmitError(null);
          }}
          onSubmit={handleGenerate}
        />
      ) : null}
    </DashboardLayout>
  );
}
