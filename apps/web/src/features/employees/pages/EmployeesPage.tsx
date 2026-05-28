import { useState } from "react";
import { DashboardLayout } from "../../dashboard/DashboardLayout";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { useDashboardScope } from "../../dashboard/hooks/useDashboardScope";
import { EmployeeDetailsModal } from "../components/EmployeeDetailsModal";
import { EmployeesFilters } from "../components/EmployeesFilters";
import { EmployeesKpiCards } from "../components/EmployeesKpiCards";
import { EmployeesTable } from "../components/EmployeesTable";
import { useEmployees } from "../hooks/useEmployees";
import { InviteEmployeeModal } from "../components/InviteEmployeeModal";
import { inviteEmployee, resendInvite } from "../services/employees.service";
import type { EmployeeListItem } from "../types/employees.types";

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white"
          />
        ))}
      </div>
      <div className="h-[480px] animate-pulse rounded-2xl border border-gray-200 bg-white" />
    </div>
  );
}

function getPageDescription(role: "DIRECTOR" | "MANAGER" | "EMPLOYEE") {
  if (role === "DIRECTOR") {
    return "Visão completa das pessoas da empresa, com filtros por função, departamento e status.";
  }

  if (role === "MANAGER") {
    return "Acompanhe apenas os usuários do seu departamento com visibilidade operacional e segura.";
  }

  return "Acesso restrito.";
}

export function EmployeesPage() {
  const { data, filters, loading, error, setFilters, resetFilters, reload } = useEmployees();
  const { permissions, canAccess } = useDashboardScope(data?.permissions);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [busyEmployeeId, setBusyEmployeeId] = useState<string | null>(null);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const canInviteEmployees = canAccess("users:manage");

  const getRequestErrorMessage = (requestError: unknown) => {
    const maybeError = requestError as {
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

    return "Não foi possível concluir a operação.";
  };

  const handleInvite = async (payload: {
    name: string;
    email: string;
    role: "MANAGER" | "EMPLOYEE";
    departmentId: string;
  }) => {
    try {
      setSubmittingInvite(true);
      setInviteError(null);
      await inviteEmployee(payload);
      setIsInviteOpen(false);
      setFeedbackMessage("Convite enviado com sucesso.");
      reload();
    } catch (requestError) {
      setInviteError(getRequestErrorMessage(requestError));
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleResendInvite = async (employee: EmployeeListItem) => {
    try {
      setBusyEmployeeId(employee.id);
      setFeedbackMessage(null);
      await resendInvite(employee.id);
      setFeedbackMessage(
        employee.status === "EXPIRED"
          ? "Convite renovado e reenviado com sucesso."
          : "Convite reenviado com sucesso.",
      );
      reload();
    } catch (requestError) {
      window.alert(getRequestErrorMessage(requestError));
    } finally {
      setBusyEmployeeId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-8">
        <LoadingState />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-8">
        <EmptyDashboardState
          title="Funcionários indisponíveis"
          description={error ?? "Não foi possível carregar a equipe."}
        />
      </div>
    );
  }

  return (
    <DashboardLayout
      context={data.context}
      permissions={permissions}
      role={data.role}
      pageEyebrow="Funcionários"
      pageTitle="Diretório de Pessoas"
      pageDescription={getPageDescription(data.role)}
    >
      <div className="space-y-6">
        {feedbackMessage ? (
          <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-5 py-4 text-sm text-[#166534]">
            {feedbackMessage}
          </div>
        ) : null}

        <EmployeesKpiCards kpis={data.kpis} role={data.role} />

        <EmployeesFilters
          role={data.role}
          filters={filters}
          departments={data.filters.departments}
          canInvite={canInviteEmployees}
          onChange={setFilters}
          onReset={resetFilters}
          onInvite={() => {
            setInviteError(null);
            setFeedbackMessage(null);
            setIsInviteOpen(true);
          }}
        />

        <EmployeesTable
          employees={data.employees}
          canManage={canInviteEmployees}
          busyEmployeeId={busyEmployeeId}
          onView={(employee) => setSelectedEmployeeId(employee.id)}
          onResend={handleResendInvite}
        />
      </div>

      {selectedEmployeeId ? (
        <EmployeeDetailsModal
          employeeId={selectedEmployeeId}
          onClose={() => setSelectedEmployeeId(null)}
        />
      ) : null}

      {isInviteOpen ? (
        <InviteEmployeeModal
          departments={data.filters.departments}
          loading={submittingInvite}
          error={inviteError}
          onClose={() => {
            setIsInviteOpen(false);
            setInviteError(null);
          }}
          onSubmit={handleInvite}
        />
      ) : null}
    </DashboardLayout>
  );
}
