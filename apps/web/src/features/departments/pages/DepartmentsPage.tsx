import { useState } from "react";
import { DashboardLayout } from "../../dashboard/DashboardLayout";
import { EmptyDashboardState } from "../../dashboard/components/EmptyDashboardState";
import { useDashboardScope } from "../../dashboard/hooks/useDashboardScope";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartmentDetails,
  updateDepartment,
} from "../services/departments.service";
import { DepartmentDetailsModal } from "../components/DepartmentDetailsModal";
import { DepartmentFormModal } from "../components/DepartmentFormModal";
import { DepartmentsFilters } from "../components/DepartmentsFilters";
import { DepartmentsKpiCards } from "../components/DepartmentsKpiCards";
import { DepartmentsTable } from "../components/DepartmentsTable";
import { useDepartments } from "../hooks/useDepartments";
import type {
  DepartmentCollaboratorOption,
  DepartmentCreatePayload,
  DepartmentDetailsItem,
  DepartmentListItem,
  DepartmentManagerOption,
  DepartmentUpdatePayload,
} from "../types/departments.types";

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
    return "Visão organizacional dos departamentos com gestão de responsáveis, estrutura e vínculos estratégicos.";
  }

  if (role === "MANAGER") {
    return "Acompanhe exclusivamente o seu departamento, sua equipe e os ciclos, objetivos e OKRs relacionados.";
  }

  return "Consulte um resumo do seu departamento e os vínculos estratégicos disponíveis no seu escopo.";
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

  return "Não foi possível concluir a operação com o departamento.";
}

export function DepartmentsPage() {
  const { data, filters, loading, error, setFilters, resetFilters, reload } = useDepartments();
  const { permissions, canAccess } = useDashboardScope(data?.permissions);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentDetailsItem | null>(null);
  const [editingManagers, setEditingManagers] = useState<DepartmentManagerOption[]>([]);
  const [editingCollaborators, setEditingCollaborators] = useState<DepartmentCollaboratorOption[]>(
    [],
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [busyDepartmentId, setBusyDepartmentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canManageDepartments = canAccess("departments:manage");
  const showFilters = data?.role === "DIRECTOR";
  const pageDescription = data ? getPageDescription(data.role) : undefined;

  const handleCreate = async (payload: DepartmentCreatePayload | DepartmentUpdatePayload) => {
    try {
      setSubmitting(true);
      setFormError(null);
      await createDepartment(payload as DepartmentCreatePayload);
      setIsCreateOpen(false);
      await Promise.resolve(reload());
    } catch (mutationError) {
      setFormError(getRequestErrorMessage(mutationError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStart = async (department: DepartmentListItem) => {
    try {
      setBusyDepartmentId(department.id);
      setFormError(null);
      const response = await fetchDepartmentDetails(department.id);
      setEditingDepartment(response.department);
      setEditingManagers(response.availableManagers);
      setEditingCollaborators(response.availableCollaborators);
    } catch (mutationError) {
      window.alert(getRequestErrorMessage(mutationError));
    } finally {
      setBusyDepartmentId(null);
    }
  };

  const handleUpdate = async (payload: DepartmentCreatePayload | DepartmentUpdatePayload) => {
    if (!editingDepartment) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await updateDepartment(editingDepartment.id, payload as DepartmentUpdatePayload);
      setEditingDepartment(null);
      setEditingManagers([]);
      setEditingCollaborators([]);
      await Promise.resolve(reload());
    } catch (mutationError) {
      setFormError(getRequestErrorMessage(mutationError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (department: DepartmentListItem) => {
    const confirmed = window.confirm(
      `Deseja excluir o departamento "${department.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyDepartmentId(department.id);
      await deleteDepartment(department.id);
      await Promise.resolve(reload());
    } catch (mutationError) {
      window.alert(getRequestErrorMessage(mutationError));
    } finally {
      setBusyDepartmentId(null);
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
          title="Departamentos indisponíveis"
          description={error ?? "Não foi possível carregar a estrutura organizacional."}
        />
      </div>
    );
  }

  return (
    <DashboardLayout
      context={data.context}
      permissions={permissions}
      role={data.role}
      pageEyebrow="Departamentos"
      pageTitle="Estrutura Organizacional"
      pageDescription={pageDescription}
    >
      <div className="space-y-6">
        <DepartmentsKpiCards kpis={data.kpis} role={data.role} />

        <DepartmentsFilters
          filters={filters}
          managers={data.filters.managers}
          showFilters={showFilters}
          canCreate={canManageDepartments}
          onChange={setFilters}
          onReset={resetFilters}
          onCreate={() => {
            setFormError(null);
            setIsCreateOpen(true);
          }}
        />

        <DepartmentsTable
          departments={data.departments}
          canManage={canManageDepartments}
          busyDepartmentId={busyDepartmentId}
          onView={(department) => setSelectedDepartmentId(department.id)}
          onEdit={handleEditStart}
          onDelete={handleDelete}
        />
      </div>

      {selectedDepartmentId ? (
        <DepartmentDetailsModal
          departmentId={selectedDepartmentId}
          onClose={() => setSelectedDepartmentId(null)}
        />
      ) : null}

      {isCreateOpen ? (
        <DepartmentFormModal
          mode="create"
          title="Novo departamento"
          managers={data.form.availableManagers}
          collaborators={data.form.availableCollaborators}
          loading={submitting}
          error={formError}
          onClose={() => {
            setIsCreateOpen(false);
            setFormError(null);
          }}
          onSubmit={handleCreate}
        />
      ) : null}

      {editingDepartment ? (
        <DepartmentFormModal
          mode="edit"
          title="Editar departamento"
          managers={editingManagers}
          collaborators={editingCollaborators}
          initialDepartment={editingDepartment}
          loading={submitting}
          error={formError}
          onClose={() => {
            setEditingDepartment(null);
            setEditingManagers([]);
            setEditingCollaborators([]);
            setFormError(null);
          }}
          onSubmit={handleUpdate}
        />
      ) : null}
    </DashboardLayout>
  );
}
