import { Filter, Plus, Search, X } from 'lucide-react';
import type {
  OkrCycleOption,
  OkrDepartmentOption,
  OkrObjectiveOption,
  OkrResponsibleOption,
  OkrsFilters as OkrsFiltersState,
} from '../types/okrs.types';

type OKRsFiltersProps = {
  filters: OkrsFiltersState;
  departments: OkrDepartmentOption[];
  cycles: OkrCycleOption[];
  objectives: OkrObjectiveOption[];
  responsibles: OkrResponsibleOption[];
  showDepartmentFilter: boolean;
  showOwnOnlyFilter: boolean;
  canCreate: boolean;
  onChange: (nextFilters: Partial<OkrsFiltersState>) => void;
  onReset: () => void;
  onCreate: () => void;
};

export function OKRsFilters({
  filters,
  departments,
  cycles,
  objectives,
  responsibles,
  showDepartmentFilter,
  showOwnOnlyFilter,
  canCreate,
  onChange,
  onReset,
  onCreate,
}: OKRsFiltersProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Buscar OKR por nome"
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
              Novo OKR
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4 xl:grid-cols-6">
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
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Ciclo</span>
          <select
            value={filters.cycleId}
            onChange={(event) => onChange({ cycleId: event.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="">Todos os ciclos</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
                {!cycle.isCycleEditable ? ' • somente leitura' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Objetivo</span>
          <select
            value={filters.objectiveId}
            onChange={(event) => onChange({ objectiveId: event.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="">Todos os objetivos</option>
            {objectives.map((objective) => (
              <option key={objective.id} value={objective.id}>
                {objective.name}
                {!objective.isCycleEditable ? ' • somente leitura' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Responsável</span>
          <select
            value={filters.responsibleId}
            onChange={(event) => onChange({ responsibleId: event.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="">Todos os responsáveis</option>
            {responsibles.map((responsible) => (
              <option key={responsible.id} value={responsible.id}>
                {responsible.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({ status: event.target.value as OkrsFiltersState['status'] })
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="">Todos</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluído</option>
            <option value="AT_RISK">Em risco</option>
          </select>
        </label>

        {showOwnOnlyFilter ? (
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
            <input
              type="checkbox"
              checked={filters.ownOnly}
              onChange={(event) => onChange({ ownOnly: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-[#0F2A44] focus:ring-[#1E4E79]"
            />
            <span className="text-sm font-medium text-[#1F2937]">Meus OKRs</span>
          </label>
        ) : null}
      </div>
    </div>
  );
}
