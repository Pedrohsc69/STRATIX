import { RotateCcw } from "lucide-react";
import type {
  ReportCycleOption,
  ReportDepartmentOption,
  ReportsFilters,
} from "../types/reports.types";

type ReportFiltersProps = {
  filters: ReportsFilters;
  departments: ReportDepartmentOption[];
  cycles: ReportCycleOption[];
  departmentLocked?: boolean;
  lockedDepartmentName?: string;
  onChange: (nextFilters: Partial<ReportsFilters>) => void;
  onReset: () => void;
};

export function ReportFilters({
  filters,
  departments,
  cycles,
  departmentLocked = false,
  lockedDepartmentName,
  onChange,
  onReset,
}: ReportFiltersProps) {
  const visibleCycles = filters.departmentId
    ? cycles.filter((cycle) => cycle.departmentId === filters.departmentId)
    : cycles;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-medium text-[#1F2937]">Filtros de exportação</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Use estes filtros como atalho para pré-selecionar departamento e ciclo antes de gerar.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F8FAFC]"
        >
          <RotateCcw className="h-4 w-4" />
          Limpar seleção
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Departamento</span>
          {departmentLocked ? (
            <div className="space-y-2">
              <input
                value={lockedDepartmentName ?? ""}
                readOnly
                className="w-full rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#1F2937] outline-none"
              />
              <p className="text-xs text-[#6B7280]">Relatórios restritos ao seu departamento.</p>
            </div>
          ) : (
            <select
              value={filters.departmentId}
              onChange={(event) =>
                onChange({
                  departmentId: event.target.value,
                  cycleId: "",
                })
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            >
              <option value="">Todos os departamentos</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Ciclo estratégico</span>
          <select
            value={filters.cycleId}
            onChange={(event) => onChange({ cycleId: event.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="">Todos os ciclos</option>
            {visibleCycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name} - {cycle.departmentName}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
