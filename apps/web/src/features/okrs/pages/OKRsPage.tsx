import { useState } from 'react';
import { DashboardLayout } from '../../dashboard/DashboardLayout';
import { EmptyDashboardState } from '../../dashboard/components/EmptyDashboardState';
import { useDashboardScope } from '../../dashboard/hooks/useDashboardScope';
import { addOkrProgress, createOkr, deleteOkr, updateOkr } from '../services/okrs.service';
import { OKRActions } from '../components/OKRActions';
import { OKRDetailsModal } from '../components/OKRDetailsModal';
import { OKRFormDialog } from '../components/OKRFormDialog';
import { OKRProgressModal } from '../components/OKRProgressModal';
import { OKRsFilters } from '../components/OKRsFilters';
import { OKRsKpiCards } from '../components/OKRsKpiCards';
import { OKRsTable } from '../components/OKRsTable';
import { useOKRs } from '../hooks/useOKRs';
import type { OkrItem, OkrPayload, OkrProgressPayload } from '../types/okrs.types';

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
    return 'Visão corporativa dos OKRs, com controle de responsáveis, evolução e consistência operacional em toda a empresa.';
  }

  if (role === 'MANAGER') {
    return 'Gerencie os OKRs do seu departamento, acompanhe responsáveis e registre atualizações com histórico.';
  }

  return 'Acompanhe os OKRs do seu departamento e atualize apenas aqueles sob sua responsabilidade.';
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

  return 'Não foi possível concluir a operação com o OKR.';
}

export function OKRsPage() {
  const { data, filters, loading, error, setFilters, resetFilters, reload } = useOKRs();
  const { permissions, canAccess } = useDashboardScope(data?.permissions);

  const [selectedOkr, setSelectedOkr] = useState<OkrItem | null>(null);
  const [editingOkr, setEditingOkr] = useState<OkrItem | null>(null);
  const [progressOkr, setProgressOkr] = useState<OkrItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [busyOkrId, setBusyOkrId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const canManageStructure = canAccess('okrs:manage') || canAccess('okrs:manage:department');
  const canDeleteStructure = canAccess('okrs:manage');
  const canUpdateOwnedProgress = canAccess('okrs:update:own');

  const showDepartmentFilter = data?.role === 'DIRECTOR';
  const showOwnOnlyFilter = data?.role === 'MANAGER' || data?.role === 'EMPLOYEE';
  const pageDescription = data ? getPageDescription(data.role) : undefined;

  const editableObjectives =
    data?.filters.objectives.filter((objective) => objective.isCycleEditable) ?? [];
  const selectedCycle = data?.filters.cycles.find((cycle) => cycle.id === filters.cycleId) ?? null;
  const selectedObjective =
    data?.filters.objectives.find((objective) => objective.id === filters.objectiveId) ?? null;
  const selectedContextIsReadOnly =
    (selectedCycle ? !selectedCycle.isCycleEditable : false) ||
    (selectedObjective ? !selectedObjective.isCycleEditable : false);
  const canCreateWithDependencies =
    canManageStructure &&
    !!data &&
    editableObjectives.length > 0 &&
    data.filters.responsibles.length > 0 &&
    !selectedContextIsReadOnly;

  const canEditOkr = (okr: OkrItem) => canManageStructure && okr.isCycleEditable;
  const canDeleteOkr = (okr: OkrItem) => canDeleteStructure && okr.isCycleEditable;
  const canUpdateProgressForOkr = (okr: OkrItem) =>
    okr.isCycleEditable &&
    (canManageStructure || (canUpdateOwnedProgress && okr.isOwnedByCurrentUser));

  const handleCreate = async (payload: OkrPayload) => {
    try {
      setSubmitting(true);
      setFormError(null);
      await createOkr(payload);
      setIsCreateOpen(false);
      reload();
    } catch (mutationError) {
      setFormError(getRequestErrorMessage(mutationError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload: OkrPayload) => {
    if (!editingOkr) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await updateOkr(editingOkr.id, payload);
      setEditingOkr(null);
      reload();
    } catch (mutationError) {
      setFormError(getRequestErrorMessage(mutationError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (okr: OkrItem) => {
    if (!okr.isCycleEditable) {
      window.alert('OKRs de ciclos somente leitura não podem ser alterados.');
      return;
    }

    const confirmed = window.confirm(`Deseja excluir o OKR "${okr.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setBusyOkrId(okr.id);
      await deleteOkr(okr.id);
      reload();
    } catch (mutationError) {
      window.alert(getRequestErrorMessage(mutationError));
    } finally {
      setBusyOkrId(null);
    }
  };

  const handleProgress = async (payload: OkrProgressPayload) => {
    if (!progressOkr) {
      return;
    }

    try {
      setSubmitting(true);
      setProgressError(null);
      await addOkrProgress(progressOkr.id, payload);
      setProgressOkr(null);
      reload();
    } catch (mutationError) {
      setProgressError(getRequestErrorMessage(mutationError));
    } finally {
      setSubmitting(false);
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
          title="OKRs indisponíveis"
          description={error ?? 'Não foi possível carregar o portfólio de OKRs.'}
        />
      </div>
    );
  }

  return (
    <DashboardLayout
      context={data.context}
      permissions={permissions}
      role={data.role}
      pageEyebrow="OKRs"
      pageTitle="Portfólio de OKRs"
      pageDescription={pageDescription}
    >
      <div className="space-y-6">
        <OKRsKpiCards kpis={data.kpis} role={data.role} />

        {selectedContextIsReadOnly ? (
          <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1E3A8A]">
            O filtro atual está em modo somente leitura. Criação e manutenção de OKRs foram
            ocultadas.
          </div>
        ) : null}

        <OKRsFilters
          filters={filters}
          departments={data.filters.departments}
          cycles={data.filters.cycles}
          objectives={data.filters.objectives}
          responsibles={data.filters.responsibles}
          showDepartmentFilter={showDepartmentFilter}
          showOwnOnlyFilter={showOwnOnlyFilter}
          canCreate={canCreateWithDependencies}
          onChange={setFilters}
          onReset={resetFilters}
          onCreate={() => {
            setFormError(null);
            setIsCreateOpen(true);
          }}
        />

        <OKRsTable
          okrs={data.okrs}
          canEdit={canEditOkr}
          canDelete={canDeleteOkr}
          canUpdateProgress={canUpdateProgressForOkr}
          busyOkrId={busyOkrId}
          onView={setSelectedOkr}
          onEdit={(okr) => {
            if (!okr.isCycleEditable) {
              window.alert('OKRs de ciclos somente leitura não podem ser alterados.');
              return;
            }
            setFormError(null);
            setEditingOkr(okr);
          }}
          onDelete={handleDelete}
          onProgress={(okr) => {
            if (!okr.isCycleEditable) {
              window.alert('OKRs de ciclos somente leitura não podem receber progresso.');
              return;
            }
            setProgressError(null);
            setProgressOkr(okr);
          }}
        />
      </div>

      {selectedOkr ? (
        <OKRDetailsModal okr={selectedOkr} onClose={() => setSelectedOkr(null)} />
      ) : null}

      {isCreateOpen ? (
        <OKRFormDialog
          title="Novo OKR"
          objectives={editableObjectives}
          responsibles={data.filters.responsibles}
          loading={submitting}
          error={formError}
          onClose={() => {
            setIsCreateOpen(false);
            setFormError(null);
          }}
          onSubmit={handleCreate}
        />
      ) : null}

      {editingOkr ? (
        <OKRFormDialog
          title="Editar OKR"
          objectives={editableObjectives}
          responsibles={data.filters.responsibles}
          initialOkr={editingOkr}
          loading={submitting}
          error={formError}
          onClose={() => {
            setEditingOkr(null);
            setFormError(null);
          }}
          onSubmit={handleUpdate}
        />
      ) : null}

      {progressOkr ? (
        <OKRProgressModal
          okr={progressOkr}
          loading={submitting}
          error={progressError}
          onClose={() => {
            setProgressOkr(null);
            setProgressError(null);
          }}
          onSubmit={handleProgress}
        />
      ) : null}
    </DashboardLayout>
  );
}
