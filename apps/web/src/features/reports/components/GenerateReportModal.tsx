import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type {
  ReportCycleOption,
  ReportDepartmentOption,
  ReportFormat,
  ReportType,
} from "../types/reports.types";

type GenerateReportModalProps = {
  type: ReportType;
  supportedFormats: ReportFormat[];
  departments: ReportDepartmentOption[];
  cycles: ReportCycleOption[];
  departmentLocked?: boolean;
  lockedDepartmentName?: string;
  defaultDepartmentId?: string;
  defaultCycleId?: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    type: ReportType;
    format: ReportFormat;
    departmentId?: string;
    cycleId?: string;
  }) => Promise<void>;
};

function getModalTitle(type: ReportType) {
  if (type === "COMPANY") {
    return "Gerar relatório geral da empresa";
  }

  if (type === "CYCLE") {
    return "Gerar relatório por ciclo";
  }

  return "Gerar relatório por departamento";
}

export function GenerateReportModal({
  type,
  supportedFormats,
  departments,
  cycles,
  departmentLocked = false,
  lockedDepartmentName,
  defaultDepartmentId,
  defaultCycleId,
  loading = false,
  error,
  onClose,
  onSubmit,
}: GenerateReportModalProps) {
  const [format, setFormat] = useState<ReportFormat>(supportedFormats[0] ?? "csv");
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ?? "");
  const [cycleId, setCycleId] = useState(defaultCycleId ?? "");

  useEffect(() => {
    setFormat(supportedFormats[0] ?? "csv");
    setDepartmentId(defaultDepartmentId ?? "");
    setCycleId(defaultCycleId ?? "");
  }, [defaultCycleId, defaultDepartmentId, supportedFormats, type]);

  const availableCycles = useMemo(() => {
    if (!departmentId) {
      return cycles;
    }

    return cycles.filter((cycle) => cycle.departmentId === departmentId);
  }, [cycles, departmentId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      type,
      format,
      departmentId: type === "DEPARTMENT" ? departmentId : undefined,
      cycleId: type === "CYCLE" ? cycleId : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">
              Exportação estratégica
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">
              {getModalTitle(type)}
            </h2>
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
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Formato</span>
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as ReportFormat)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            >
              {supportedFormats.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          {type === "CYCLE" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">
                Ciclo estratégico
              </span>
              <select
                required
                value={cycleId}
                onChange={(event) => setCycleId(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
              >
                <option value="">Selecione um ciclo</option>
                {availableCycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name} - {cycle.departmentName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {type === "DEPARTMENT" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4B5563]">Departamento</span>
              {departmentLocked ? (
                <div className="space-y-2">
                  <input
                    value={lockedDepartmentName ?? ""}
                    readOnly
                    className="w-full rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#1F2937] outline-none"
                  />
                  <p className="text-xs text-[#6B7280]">
                    Gestores podem exportar apenas dados do proprio departamento.
                  </p>
                </div>
              ) : (
                <select
                  required
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
                >
                  <option value="">Selecione um departamento</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {error}
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
              {loading ? "Gerando..." : `Baixar ${format.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
