import { useMemo, useState } from 'react';
import { DashboardLayout } from '../../dashboard/DashboardLayout';
import { EmptyDashboardState } from '../../dashboard/components/EmptyDashboardState';
import { useDashboardScope } from '../../dashboard/hooks/useDashboardScope';
import { createObjective, deleteObjective, updateObjective } from '../services/objectives.service';
import { ObjectiveDetailsDialog } from '../components/ObjectiveDetailsDialog';
import { ObjectiveFormDialog } from '../components/ObjectiveFormDialog';
import { ObjectivesFilters } from '../components/ObjectivesFilters';
import { ObjectivesKpiCards } from '../components/ObjectivesKpiCards';
import { ObjectivesTable } from '../components/ObjectivesTable';
import { useObjectives } from '../hooks/useObjectives';
import type { ObjectiveItem, ObjectivePayload } from '../types/objectives.types';

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

function getPageDescription(role: 'DIRECTOR' | 'MANAGER' | 'EMPLOYEE') {
  if (role === 'DIRECTOR') {
    return 'Visão corporativa dos objetivos estratégicos, com leitura executiva e capacidade de gestão em toda a empresa.';
  }

  if (role === 'MANAGER') {
    return 'Acompanhe e gerencie os objetivos do seu departamento, com foco operacional e vínculo direto aos ciclos.';
  }

  return 'Consulte os objetivos estratégicos do seu departamento em modo leitura, sem ações administrativas.';
}

function getRequestErrorMessage(error: unknown) {
  const maybeError = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
  };

  if (typeof maybeError.response?.data?.message === 'string') {
    return maybeError.response.data.message;
  }

  if (Array.isArray(maybeError.response?.data?.message)) {
    return maybeError.response.data.message.join(', ');
  }

  return 'Não foi possível concluir a operação com o objetivo estratégico.';
}

export function ObjectivesPage() {
  const { data, filters, loading, error, setFilters, resetFilters, reload } = useObjectives();
  const { permissions, canAccess } = useDashboardScope(data?.permissions);

  const [selectedObjective, setSelectedObjective] = useState<ObjectiveItem | null>(null);
  const [editingObjective, setEditingObjective] = useState<ObjectiveItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [busyObjectiveId, setBusyObjectiveId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canCreateObjectives =
    canAccess('objectives:manage') || canAccess('objectives:manage:department');
  const canEditObjectives = canCreateObjectives;
  const canDeleteObjectives = canAccess('objectives:manage');
  const showDepartmentFilter = data?.role === 'DIRECTOR';
  const pageDescription = data ? getPageDescription(data.role) : undefined;

  const editableCycles = useMemo(
    () => data?.filters.cycles.filter((cycle) => cycle.isCycleEditable) ?? [],
    [data],
  );
  const selectedCycle = useMemo(
    () => data?.filters.cycles.find((cycle) => cycle.id === filters.cycleId) ?? null,
    [data, filters.cycleId],
  );
  const defaultCycleId = useMemo(() => editableCycles[0]?.id ?? '', [editableCycles]);

  const handleCreate = async (payload: ObjectivePayload) => {
    try {
      setSubmitting(true);
      setFormError(null);
      await createObjective(payload);
      setIsCreateOpen(false);
      reload();
    } catch (mutationError) {
      setFormError(getRequestErrorMessage(mutationError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload: ObjectivePayload) => {
    if (!editingObjective) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await updateObjective(editingObjective.id, payload);
      setEditingObjective(null);
      reload();
    } catch (mutationError) {
      setFormError(getRequestErrorMessage(mutationError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (objective: ObjectiveItem) => {
    if (!objective.isCycleEditable) {
      window.alert('Objetivos de ciclos somente leitura não podem ser alterados.');
      return;
    }

    const confirmed = window.confirm(`Deseja excluir o objetivo "${objective.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setBusyObjectiveId(objective.id);
      await deleteObjective(objective.id);
      reload();
    } catch (mutationError) {
      window.alert(getRequestErrorMessage(mutationError));
    } finally {
      setBusyObjectiveId(null);
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
          title="Objetivos estratégicos indisponíveis"
          description={error ?? 'Não foi possível carregar o portfólio de objetivos.'}
        />
      </div>
    );
  }

  const selectedCycleIsReadOnly = selectedCycle ? !selectedCycle.isCycleEditable : false;
  const canCreateWithCycles =
    canCreateObjectives && editableCycles.length > 0 && !selectedCycleIsReadOnly;
  const canEditObjective = (objective: ObjectiveItem) =>
    canEditObjectives && objective.isCycleEditable;
  const canDeleteObjective = (objective: ObjectiveItem) =>
    canDeleteObjectives && objective.isCycleEditable;

  return (
    <DashboardLayout
      context={data.context}
      permissions={permissions}
      role={data.role}
      pageEyebrow="Objetivos Estratégicos"
      pageTitle="Portfólio de Objetivos"
      pageDescription={pageDescription}
    >
      <div className="space-y-6">
        <ObjectivesKpiCards kpis={data.kpis} />

        {selectedCycleIsReadOnly ? (
          <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1E3A8A]">
            O ciclo selecionado está disponível apenas para consulta. Criação e manutenção de
            objetivos foram ocultadas.
          </div>
        ) : null}

        <ObjectivesFilters
          filters={filters}
          departments={data.filters.departments}
          cycles={data.filters.cycles}
          priorities={data.filters.priorities}
          showDepartmentFilter={showDepartmentFilter}
          canCreate={canCreateWithCycles}
          onChange={setFilters}
          onReset={resetFilters}
          onCreate={() => {
            setFormError(null);
            setIsCreateOpen(true);
          }}
        />

        <ObjectivesTable
          objectives={data.objectives}
          canEdit={canEditObjective}
          canDelete={canDeleteObjective}
          busyObjectiveId={busyObjectiveId}
          onView={setSelectedObjective}
          onEdit={(objective) => {
            if (!objective.isCycleEditable) {
              window.alert('Objetivos de ciclos somente leitura não podem ser alterados.');
              return;
            }
            setFormError(null);
            setEditingObjective(objective);
          }}
          onDelete={handleDelete}
        />
      </div>

      {selectedObjective ? (
        <ObjectiveDetailsDialog
          objective={selectedObjective}
          onClose={() => setSelectedObjective(null)}
        />
      ) : null}

      {isCreateOpen ? (
        <ObjectiveFormDialog
          title="Novo objetivo estratégico"
          cycles={editableCycles}
          initialObjective={
            defaultCycleId
              ? ({
                  id: '',
                  name: '',
                  description: '',
                  cycleId: defaultCycleId,
                  cycleName: '',
                  cycleStatus: 'ACTIVE',
                  cycleEndDate: new Date().toISOString(),
                  isCycleEditable: true,
                  departmentId: '',
                  departmentName: '',
                  status: 'IN_PROGRESS',
                  priority: 'UNSPECIFIED',
                  progress: 0,
                  okrsCount: 0,
                  ownerNames: [],
                  period: {
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                  },
                } satisfies ObjectiveItem)
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

      {editingObjective ? (
        <ObjectiveFormDialog
          title="Editar objetivo estratégico"
          cycles={editableCycles}
          initialObjective={editingObjective}
          loading={submitting}
          error={formError}
          onClose={() => {
            setEditingObjective(null);
            setFormError(null);
          }}
          onSubmit={handleUpdate}
        />
      ) : null}
    </DashboardLayout>
  );
}
