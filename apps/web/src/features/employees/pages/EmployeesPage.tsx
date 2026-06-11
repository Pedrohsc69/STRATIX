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
  const [demoInvite, setDemoInvite] = useState<{ email: string; inviteUrl: string } | null>(null);

  const canInviteEmployees = canAccess("users:manage");

  const copyInviteLink = async (inviteUrl: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setFeedbackMessage("Link do convite copiado com sucesso.");
    } catch {
      window.alert("Não foi possível copiar o link do convite.");
    }
  };

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
    email: string;
    role: "MANAGER" | "EMPLOYEE";
    departmentId: string;
  }) => {
    try {
      setSubmittingInvite(true);
      setInviteError(null);
      const response = await inviteEmployee(payload);
      setIsInviteOpen(false);
      if (response.inviteUrl) {
        setDemoInvite({
          email: response.email,
          inviteUrl: response.inviteUrl,
        });
        setFeedbackMessage(null);
      } else {
        setDemoInvite(null);
        setFeedbackMessage("Convite enviado com sucesso.");
      }
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
      setDemoInvite(null);
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
      <div className="min-h-screen bg-[#F5F7FA] p-4 sm:p-6 lg:p-8">
        <LoadingState />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-4 sm:p-6 lg:p-8">
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
        {demoInvite ? (
          <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-5 py-4 text-sm text-[#1D4ED8]">
            <p className="font-semibold">Modo demonstração: envio por e-mail desativado.</p>
            <p className="mt-1">
              Use o link abaixo para aceitar o convite de {demoInvite.email}.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="break-all rounded-xl bg-white px-3 py-2 text-xs text-[#1E3A8A]">
                {demoInvite.inviteUrl}
              </code>
              <button
                type="button"
                onClick={() => void copyInviteLink(demoInvite.inviteUrl)}
                className="rounded-xl bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF]"
              >
                Copiar link do convite
              </button>
            </div>
          </div>
        ) : null}

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
            setDemoInvite(null);
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
