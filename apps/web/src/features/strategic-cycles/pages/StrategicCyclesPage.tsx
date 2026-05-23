import { useMemo, useState } from "react";
import { DashboardLayout } from "../../dashboard/DashboardLayout";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { useDashboardScope } from "../../dashboard/hooks/useDashboardScope";
import {
  closeStrategicCycle,
  createStrategicCycle,
  updateStrategicCycle,
} from "../services/strategic-cycles.service";
import { StrategicCycleDetailsDialog } from "../components/StrategicCycleDetailsDialog";
import { StrategicCycleFormDialog } from "../components/StrategicCycleFormDialog";
import { StrategicCyclesFilters } from "../components/StrategicCyclesFilters";
import { StrategicCyclesKpiCards } from "../components/StrategicCyclesKpiCards";
import { StrategicCyclesTable } from "../components/StrategicCyclesTable";
import { useStrategicCycles } from "../hooks/useStrategicCycles";
import type {
  StrategicCycleItem,
  StrategicCyclePayload,
} from "../types/strategic-cycles.types";

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
    return "Visão corporativa dos ciclos estratégicos, com filtros por departamento, andamento e período.";
  }

  if (role === "MANAGER") {
    return "Acompanhe exclusivamente os ciclos vinculados ao seu departamento, com foco operacional e leitura rápida.";
  }

  return "Consulte os ciclos estratégicos do seu departamento em modo leitura.";
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

  return "Não foi possível concluir a operação com o ciclo estratégico.";
}

export function StrategicCyclesPage() {
  const { data, filters, loading, error, setFilters, resetFilters, reload } =
    useStrategicCycles();
  const { permissions, canAccess } = useDashboardScope(data?.permissions);

  const [selectedCycle, setSelectedCycle] = useState<StrategicCycleItem | null>(null);
  const [editingCycle, setEditingCycle] = useState<StrategicCycleItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [busyCycleId, setBusyCycleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canManageCycles = canAccess("cycles:manage");
  const showDepartmentFilter = data?.role === "DIRECTOR";
  const pageDescription = data ? getPageDescription(data.role) : undefined;

  const defaultDepartmentId = useMemo(() => {
    if (!data) {
      return "";
    }

    if (data.role === "DIRECTOR") {
      return data.filters.departments[0]?.id ?? "";
    }

    return data.context.department?.id ?? data.filters.departments[0]?.id ?? "";
  }, [data]);

  const handleCreate = async (payload: StrategicCyclePayload) => {
    try {
      setSubmitting(true);
      setFormError(null);
      await createStrategicCycle(payload);
      setIsCreateOpen(false);
      reload();
    } catch (mutationError) {
      setFormError(getRequestErrorMessage(mutationError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload: StrategicCyclePayload) => {
    if (!editingCycle) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await updateStrategicCycle(editingCycle.id, payload);
      setEditingCycle(null);
      reload();
    } catch (mutationError) {
      setFormError(getRequestErrorMessage(mutationError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseCycle = async (cycle: StrategicCycleItem) => {
    const confirmed = window.confirm(`Deseja encerrar o ciclo "${cycle.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setBusyCycleId(cycle.id);
      await closeStrategicCycle(cycle.id);
      reload();
    } catch (mutationError) {
      window.alert(getRequestErrorMessage(mutationError));
    } finally {
      setBusyCycleId(null);
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
          title="Ciclos estratégicos indisponíveis"
          description={error ?? "Não foi possível carregar o portfólio estratégico."}
        />
      </div>
    );
  }

  const canCreateCycles = canManageCycles && data.filters.departments.length > 0;

  return (
    <DashboardLayout
      context={data.context}
      permissions={permissions}
      role={data.role}
      pageEyebrow="Ciclos Estratégicos"
      pageTitle="Portfólio de Ciclos"
      pageDescription={pageDescription}
    >
      <div className="space-y-6">
        <StrategicCyclesKpiCards kpis={data.kpis} />

        <StrategicCyclesFilters
          filters={filters}
          departments={data.filters.departments}
          showDepartmentFilter={showDepartmentFilter}
          canCreate={canCreateCycles}
          onChange={setFilters}
          onReset={resetFilters}
          onCreate={() => {
            setFormError(null);
            setIsCreateOpen(true);
          }}
        />

        <StrategicCyclesTable
          cycles={data.cycles}
          canManage={canManageCycles}
          busyCycleId={busyCycleId}
          onView={setSelectedCycle}
          onEdit={(cycle) => {
            setFormError(null);
            setEditingCycle(cycle);
          }}
          onClose={handleCloseCycle}
        />
      </div>

      {selectedCycle ? (
        <StrategicCycleDetailsDialog
          cycle={selectedCycle}
          onClose={() => setSelectedCycle(null)}
        />
      ) : null}

      {isCreateOpen ? (
        <StrategicCycleFormDialog
          title="Novo ciclo estratégico"
          departments={data.filters.departments}
          initialCycle={
            defaultDepartmentId
              ? ({
                  id: "",
                  name: "",
                  departmentId: defaultDepartmentId,
                  departmentName: "",
                  status: "ACTIVE",
                  startDate: "",
                  endDate: "",
                  progress: 0,
                  objectivesCount: 0,
                  okrsCount: 0,
                  objectiveNames: [],
                  ownerNames: [],
                } satisfies StrategicCycleItem)
              : null
          }
          loading={submitting}
          error={formError}
          onClose={() => {
            setIsCreateOpen(false);
            setFormError(null);
          }}
          onSubmit={handleCreate}
        />
      ) : null}

      {editingCycle ? (
        <StrategicCycleFormDialog
          title="Editar ciclo estratégico"
          departments={data.filters.departments}
          initialCycle={editingCycle}
          loading={submitting}
          error={formError}
          onClose={() => {
            setEditingCycle(null);
            setFormError(null);
          }}
          onSubmit={handleUpdate}
        />
      ) : null}
    </DashboardLayout>
  );
}
