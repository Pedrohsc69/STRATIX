import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type {
  OkrDepartmentOption,
  OkrPayload,
  OkrItem,
  OkrMetricType,
  OkrObjectivePriority,
  OkrObjectiveOption,
  OkrResponsibleOption,
  OkrStatus,
  UpdateOkrPayload,
} from '../types/okrs.types';
import {
  getMetricInputConfig,
  getMetricTypeLabel,
  normalizeMetricValue,
  parseMetricInputValue,
  validateMetricValues,
} from '../utils/okr-formatters';

type OKRFormDialogProps = {
  title: string;
  departments: OkrDepartmentOption[];
  objectives: OkrObjectiveOption[];
  responsibles: OkrResponsibleOption[];
  initialOkr?: OkrItem | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: OkrPayload | UpdateOkrPayload) => Promise<void>;
};

type FormState = {
  name: string;
  departmentId: string;
  objectiveId: string;
  responsibleId: string;
  metricType: OkrMetricType;
  currentValue: string;
  targetValue: string;
};

const objectivePriorityLabels: Record<OkrObjectivePriority, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
  UNSPECIFIED: 'Não definida',
};

const objectiveStatusLabels: Record<OkrStatus, string> = {
  IN_PROGRESS: 'Em andamento',
  AT_RISK: 'Em risco',
  COMPLETED: 'Concluído',
};

const objectiveStatusPriority: Record<OkrStatus, number> = {
  IN_PROGRESS: 0,
  AT_RISK: 1,
  COMPLETED: 2,
};

const objectivePriorityOrder: Record<OkrObjectivePriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  UNSPECIFIED: 3,
};

function summarizeDescription(description: string) {
  const normalized = description.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return 'Sem descricao';
  }

  return normalized.length > 48 ? `${normalized.slice(0, 45)}...` : normalized;
}

function formatObjectiveOptionLabel(objective: OkrObjectiveOption) {
  return [
    objective.name,
    summarizeDescription(objective.description),
    objective.departmentName,
    objective.cycleName,
    objectivePriorityLabels[objective.priority],
    objectiveStatusLabels[objective.status],
  ].join(' • ');
}

function sortObjectives(objectives: OkrObjectiveOption[]) {
  return [...objectives].sort((left, right) => {
    const editableDelta = Number(right.isCycleEditable) - Number(left.isCycleEditable);

    if (editableDelta !== 0) {
      return editableDelta;
    }

    const statusDelta =
      objectiveStatusPriority[left.status] - objectiveStatusPriority[right.status];

    if (statusDelta !== 0) {
      return statusDelta;
    }

    const priorityDelta =
      objectivePriorityOrder[left.priority] - objectivePriorityOrder[right.priority];

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function getInitialState(
  objectives: OkrObjectiveOption[],
  responsibles: OkrResponsibleOption[],
  okr?: OkrItem | null,
): FormState {
  const sortedObjectives = sortObjectives(objectives);
  const selectedObjective =
    sortedObjectives.find((objective) => objective.id === okr?.objectiveId) ??
    sortedObjectives[0] ??
    null;

  return {
    name: okr?.name ?? '',
    departmentId: okr?.departmentId ?? selectedObjective?.departmentId ?? '',
    objectiveId: okr?.objectiveId ?? selectedObjective?.id ?? '',
    responsibleId: okr?.responsibleId ?? responsibles[0]?.id ?? '',
    metricType: okr?.metricType ?? 'NUMBER',
    currentValue: okr ? String(okr.currentValue) : '0',
    targetValue: okr?.metricType === 'BOOLEAN' ? '1' : okr ? String(okr.targetValue) : '',
  };
}

function getMetricDefaults(metricType: OkrMetricType, currentValue: string, targetValue: string) {
  if (metricType === 'PERCENTAGE') {
    return {
      currentValue,
      targetValue: targetValue || '100',
    };
  }

  if (metricType === 'BOOLEAN') {
    return {
      currentValue: currentValue === '1' ? '1' : '0',
      targetValue: '1',
    };
  }

  return {
    currentValue,
    targetValue,
  };
}

function MetricValueField(props: {
  label: string;
  value: string;
  metricType: OkrMetricType;
  placeholder?: string;
  disabled?: boolean;
  helper?: string;
  booleanOptions?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const config = getMetricInputConfig(props.metricType);

  if (config.isBoolean) {
    return (
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#4B5563]">{props.label}</span>
        <select
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          disabled={props.disabled}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
        >
          {(
            props.booleanOptions ?? [
              { value: '0', label: 'Não concluído' },
              { value: '1', label: 'Concluído' },
            ]
          ).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {props.helper ? <p className="mt-2 text-xs text-[#6B7280]">{props.helper}</p> : null}
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#4B5563]">{props.label}</span>
      <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:border-[#1E4E79]">
        {config.prefix ? (
          <span className="border-r border-gray-200 px-4 text-sm font-medium text-[#6B7280]">
            {config.prefix}
          </span>
        ) : null}
        <input
          required
          type="text"
          inputMode="decimal"
          value={props.value}
          placeholder={props.placeholder}
          disabled={props.disabled}
          onChange={(event) => props.onChange(event.target.value)}
          className="w-full rounded-xl bg-transparent px-4 py-3 text-sm text-[#1F2937] outline-none"
        />
        {config.suffix ? (
          <span className="border-l border-gray-200 px-4 text-sm font-medium text-[#6B7280]">
            {config.suffix}
          </span>
        ) : null}
      </div>
      {props.helper ? <p className="mt-2 text-xs text-[#6B7280]">{props.helper}</p> : null}
    </label>
  );
}

export function OKRFormDialog({
  title,
  departments,
  objectives,
  responsibles,
  initialOkr,
  loading = false,
  error,
  onClose,
  onSubmit,
}: OKRFormDialogProps) {
  const [form, setForm] = useState<FormState>(() =>
    getInitialState(objectives, responsibles, initialOkr),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setForm(getInitialState(objectives, responsibles, initialOkr));
    setValidationError(null);
  }, [objectives, responsibles, initialOkr]);

  const sortedObjectives = useMemo(() => sortObjectives(objectives), [objectives]);
  const filteredObjectives = useMemo(
    () =>
      sortedObjectives.filter((objective) =>
        form.departmentId ? objective.departmentId === form.departmentId : true,
      ),
    [form.departmentId, sortedObjectives],
  );
  const selectedObjective = useMemo(
    () => objectives.find((objective) => objective.id === form.objectiveId) ?? null,
    [form.objectiveId, objectives],
  );
  const filteredResponsibles = useMemo(() => {
    if (!selectedObjective) {
      return responsibles;
    }

    return responsibles.filter(
      (responsible) =>
        !responsible.departmentId || responsible.departmentId === selectedObjective.departmentId,
    );
  }, [responsibles, selectedObjective]);

  const metricConfig = getMetricInputConfig(form.metricType);
  const isEditing = !!initialOkr;

  useEffect(() => {
    if (!filteredObjectives.length) {
      if (form.objectiveId) {
        setForm((current) => ({ ...current, objectiveId: '' }));
      }
      return;
    }

    if (!filteredObjectives.some((objective) => objective.id === form.objectiveId)) {
      setForm((current) => ({
        ...current,
        objectiveId: filteredObjectives[0]?.id ?? '',
      }));
    }
  }, [filteredObjectives, form.objectiveId]);

  useEffect(() => {
    if (!filteredResponsibles.length) {
      if (form.responsibleId) {
        setForm((current) => ({ ...current, responsibleId: '' }));
      }
      return;
    }

    if (!filteredResponsibles.some((responsible) => responsible.id === form.responsibleId)) {
      setForm((current) => ({
        ...current,
        responsibleId: filteredResponsibles[0]?.id ?? '',
      }));
    }
  }, [filteredResponsibles, form.responsibleId]);

  const handleMetricTypeChange = (metricType: OkrMetricType) => {
    setForm((current) => {
      const defaults = getMetricDefaults(metricType, current.currentValue, current.targetValue);
      return {
        ...current,
        metricType,
        currentValue: defaults.currentValue,
        targetValue: defaults.targetValue,
      };
    });
    setValidationError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedCurrentValue = parseMetricInputValue(form.currentValue, form.metricType);
    const parsedTargetValue = parseMetricInputValue(form.targetValue, form.metricType);

    if (parsedCurrentValue === null) {
      setValidationError('Informe um valor inicial válido.');
      return;
    }

    if (parsedTargetValue === null) {
      setValidationError('Informe um valor meta válido.');
      return;
    }

    const metricValidationError = validateMetricValues({
      metricType: form.metricType,
      currentValue: parsedCurrentValue,
      targetValue: parsedTargetValue,
    });

    if (metricValidationError) {
      setValidationError(metricValidationError);
      return;
    }

    setValidationError(null);

    if (isEditing) {
      await onSubmit({
        name: form.name.trim(),
        objectiveId: form.objectiveId,
        responsibleId: form.responsibleId,
        metricType: form.metricType,
        targetValue: normalizeMetricValue(parsedTargetValue, form.metricType),
      });
      return;
    }

    await onSubmit({
      name: form.name.trim(),
      objectiveId: form.objectiveId,
      responsibleId: form.responsibleId,
      metricType: form.metricType,
      currentValue: normalizeMetricValue(parsedCurrentValue, form.metricType),
      targetValue: normalizeMetricValue(parsedTargetValue, form.metricType),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">Gestão de OKRs</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 p-2 text-[#6B7280] transition-colors hover:bg-[#F8FAFC]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Nome do OKR</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              placeholder="Ex.: Elevar MRR em 20%"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Departamento</span>
              <select
                required
                value={form.departmentId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, departmentId: event.target.value }))
                }
                disabled={departments.length <= 1}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79] disabled:cursor-not-allowed disabled:bg-[#F8FAFC]"
              >
                <option value="" disabled>
                  Selecione um departamento
                </option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Objetivo</span>
              <select
                required
                value={form.objectiveId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, objectiveId: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
                disabled={!filteredObjectives.length}
              >
                {!filteredObjectives.length ? (
                  <option value="">Nenhum objetivo disponivel para o departamento selecionado</option>
                ) : null}
                {filteredObjectives.map((objective) => (
                  <option
                    key={objective.id}
                    value={objective.id}
                    disabled={!objective.isCycleEditable}
                  >
                    {formatObjectiveOptionLabel(objective)}
                    {!objective.isCycleEditable ? ' • somente leitura' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Responsável</span>
              <select
                required
                value={form.responsibleId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, responsibleId: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
                disabled={!filteredResponsibles.length}
              >
                {!filteredResponsibles.length ? (
                  <option value="">Nenhum responsável disponível para este departamento</option>
                ) : null}
                {filteredResponsibles.map((responsible) => (
                  <option key={responsible.id} value={responsible.id}>
                    {responsible.name}
                    {responsible.departmentName ? ` • ${responsible.departmentName}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <label className="block md:col-span-1">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Tipo de métrica</span>
              <select
                value={form.metricType}
                onChange={(event) => handleMetricTypeChange(event.target.value as OkrMetricType)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              >
                {(['NUMBER', 'PERCENTAGE', 'CURRENCY', 'BOOLEAN'] as OkrMetricType[]).map(
                  (metricType) => (
                    <option key={metricType} value={metricType}>
                      {getMetricTypeLabel(metricType)}
                    </option>
                  ),
                )}
              </select>
            </label>

            {!isEditing ? (
              <MetricValueField
                label="Valor inicial"
                metricType={form.metricType}
                value={form.currentValue}
                placeholder={metricConfig.placeholder}
                helper={metricConfig.helper}
                booleanOptions={[
                  { value: '0', label: 'Não concluído' },
                  { value: '1', label: 'Concluído' },
                ]}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    currentValue: value,
                  }))
                }
              />
            ) : (
              <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1E3A8A]">
                O progresso do OKR é atualizado somente pelo endpoint de progresso.
              </div>
            )}

            <MetricValueField
              label="Valor meta"
              metricType={form.metricType}
              value={form.targetValue}
              placeholder={metricConfig.placeholder}
              helper={
                form.metricType === 'PERCENTAGE'
                  ? 'Para percentuais, a meta recomendada é 100.'
                  : form.metricType === 'BOOLEAN'
                    ? 'Para métricas binárias, a meta é sempre concluído.'
                    : metricConfig.helper
              }
              booleanOptions={[{ value: '1', label: 'Concluído' }]}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  targetValue: value,
                }))
              }
            />
          </div>

          {validationError || error ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {validationError ?? error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F8FAFC]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Salvando...' : 'Salvar OKR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
