import { Filter, Plus, Search, X } from 'lucide-react';
import type {
  ObjectiveCycleOption,
  ObjectiveDepartmentOption,
  ObjectivePriority,
  ObjectivesFilters as ObjectivesFiltersState,
} from '../types/objectives.types';

type ObjectivesFiltersProps = {
  filters: ObjectivesFiltersState;
  departments: ObjectiveDepartmentOption[];
  cycles: ObjectiveCycleOption[];
  priorities: ObjectivePriority[];
  showDepartmentFilter: boolean;
  canCreate: boolean;
  onChange: (nextFilters: Partial<ObjectivesFiltersState>) => void;
  onReset: () => void;
  onCreate: () => void;
};

export function ObjectivesFilters({
  filters,
  departments,
  cycles,
  priorities,
  showDepartmentFilter,
  canCreate,
  onChange,
  onReset,
  onCreate,
}: ObjectivesFiltersProps) {
  const priorityLabels: Record<ObjectivePriority, string> = {
    HIGH: 'Alta',
    MEDIUM: 'Média',
    LOW: 'Baixa',
    UNSPECIFIED: 'Não definida',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Buscar objetivo por nome"
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
              Novo objetivo
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4 xl:grid-cols-5">
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
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Ciclo estratégico</span>
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
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({ status: event.target.value as ObjectivesFiltersState['status'] })
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="">Todos</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluído</option>
            <option value="AT_RISK">Em risco</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Prioridade</span>
          <select
            value={filters.priority}
            onChange={(event) =>
              onChange({ priority: event.target.value as ObjectivesFiltersState['priority'] })
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="">Todas</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
