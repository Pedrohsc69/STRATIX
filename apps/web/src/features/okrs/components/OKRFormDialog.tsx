import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type {
  OkrItem,
  OkrMetricType,
  OkrObjectiveOption,
  OkrPayload,
  OkrResponsibleOption,
} from "../types/okrs.types";
import {
  getMetricInputConfig,
  getMetricTypeLabel,
  normalizeMetricValue,
  parseMetricInputValue,
  validateMetricValues,
} from "../utils/okr-formatters";

type OKRFormDialogProps = {
  title: string;
  objectives: OkrObjectiveOption[];
  responsibles: OkrResponsibleOption[];
  initialOkr?: OkrItem | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: OkrPayload) => Promise<void>;
};

type FormState = {
  name: string;
  objectiveId: string;
  responsibleId: string;
  metricType: OkrMetricType;
  currentValue: string;
  targetValue: string;
};

function getInitialState(
  objectives: OkrObjectiveOption[],
  responsibles: OkrResponsibleOption[],
  okr?: OkrItem | null,
): FormState {
  return {
    name: okr?.name ?? "",
    objectiveId: okr?.objectiveId ?? objectives[0]?.id ?? "",
    responsibleId: okr?.responsibleId ?? responsibles[0]?.id ?? "",
    metricType: okr?.metricType ?? "NUMBER",
    currentValue: okr ? String(okr.currentValue) : "0",
    targetValue:
      okr?.metricType === "BOOLEAN"
        ? "1"
        : okr
          ? String(okr.targetValue)
          : "",
  };
}

function getMetricDefaults(metricType: OkrMetricType, currentValue: string, targetValue: string) {
  if (metricType === "PERCENTAGE") {
    return {
      currentValue,
      targetValue: targetValue || "100",
    };
  }

  if (metricType === "BOOLEAN") {
    return {
      currentValue: currentValue === "1" ? "1" : "0",
      targetValue: "1",
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
          {(props.booleanOptions ?? [
            { value: "0", label: "Não concluído" },
            { value: "1", label: "Concluído" },
          ]).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {props.helper ? (
          <p className="mt-2 text-xs text-[#6B7280]">{props.helper}</p>
        ) : null}
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

  const metricConfig = getMetricInputConfig(form.metricType);

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
      setValidationError("Informe um valor inicial válido.");
      return;
    }

    if (parsedTargetValue === null) {
      setValidationError("Informe um valor meta válido.");
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
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
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
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Objetivo</span>
              <select
                required
                value={form.objectiveId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, objectiveId: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              >
                {objectives.map((objective) => (
                  <option key={objective.id} value={objective.id}>
                    {objective.name}
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
              >
                {responsibles.map((responsible) => (
                  <option key={responsible.id} value={responsible.id}>
                    {responsible.name}
                    {responsible.departmentName ? ` • ${responsible.departmentName}` : ""}
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
                {(["NUMBER", "PERCENTAGE", "CURRENCY", "BOOLEAN"] as OkrMetricType[]).map(
                  (metricType) => (
                    <option key={metricType} value={metricType}>
                      {getMetricTypeLabel(metricType)}
                    </option>
                  ),
                )}
              </select>
            </label>

            <MetricValueField
              label="Valor inicial"
              metricType={form.metricType}
              value={form.currentValue}
              placeholder={metricConfig.placeholder}
              helper={metricConfig.helper}
              booleanOptions={[
                { value: "0", label: "Não concluído" },
                { value: "1", label: "Concluído" },
              ]}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  currentValue: value,
                }))
              }
            />

            <MetricValueField
              label="Valor meta"
              metricType={form.metricType}
              value={form.targetValue}
              placeholder={metricConfig.placeholder}
              helper={
                form.metricType === "PERCENTAGE"
                  ? "Para percentuais, a meta recomendada é 100."
                  : form.metricType === "BOOLEAN"
                    ? "Para métricas binárias, a meta é sempre concluído."
                    : metricConfig.helper
              }
              booleanOptions={[{ value: "1", label: "Concluído" }]}
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

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
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
              {loading ? "Salvando..." : "Salvar OKR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
