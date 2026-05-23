import { Filter, Plus, Search, X } from "lucide-react";
import type {
  StrategicCycleDepartmentOption,
  StrategicCyclesFilters,
} from "../types/strategic-cycles.types";

type StrategicCyclesFiltersProps = {
  filters: StrategicCyclesFilters;
  departments: StrategicCycleDepartmentOption[];
  showDepartmentFilter: boolean;
  canCreate: boolean;
  onChange: (nextFilters: Partial<StrategicCyclesFilters>) => void;
  onReset: () => void;
  onCreate: () => void;
};

export function StrategicCyclesFilters({
  filters,
  departments,
  showDepartmentFilter,
  canCreate,
  onChange,
  onReset,
  onCreate,
}: StrategicCyclesFiltersProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Buscar ciclo por nome"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F8FAFC]"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </button>

          {canCreate ? (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757]"
            >
              <Plus className="h-4 w-4" />
              Novo ciclo
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
        {showDepartmentFilter ? (
          <label className="block">
            <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[#4B5563]">
              <Filter className="h-4 w-4" />
              Departamento
            </span>
            <select
              value={filters.departmentId}
              onChange={(event) => onChange({ departmentId: event.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            >
              <option value="">Todos os departamentos</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({
                status: event.target.value as StrategicCyclesFilters["status"],
              })
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Em andamento</option>
            <option value="CLOSED">Concluídos</option>
            <option value="DELAYED">Atrasados</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Início a partir de</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange({ startDate: event.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Fim até</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange({ endDate: event.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          />
        </label>
      </div>
    </div>
  );
}
