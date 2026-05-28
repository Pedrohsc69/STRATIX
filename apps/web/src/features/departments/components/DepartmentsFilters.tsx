import { ArrowDownUp, Plus, Search, X } from "lucide-react";
import type {
  DepartmentManagerOption,
  DepartmentsFilters as DepartmentsFiltersType,
} from "../types/departments.types";

type DepartmentsFiltersProps = {
  filters: DepartmentsFiltersType;
  managers: DepartmentManagerOption[];
  showFilters: boolean;
  canCreate: boolean;
  onChange: (nextFilters: Partial<DepartmentsFiltersType>) => void;
  onReset: () => void;
  onCreate: () => void;
};

export function DepartmentsFilters({
  filters,
  managers,
  showFilters,
  canCreate,
  onChange,
  onReset,
  onCreate,
}: DepartmentsFiltersProps) {
  if (!showFilters && !canCreate) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {showFilters ? (
          <div className="relative w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Buscar departamento ou gestor"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            />
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-[#1F2937]">Escopo do seu departamento</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Visualize a estrutura e os vínculos estratégicos sem controles extras.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {showFilters ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F8FAFC]"
            >
              <X className="h-4 w-4" />
              Limpar filtros
            </button>
          ) : null}

          {canCreate ? (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757]"
            >
              <Plus className="h-4 w-4" />
              Novo departamento
            </button>
          ) : null}
        </div>
      </div>

      {showFilters ? (
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Gestor</span>
            <select
              value={filters.managerId}
              onChange={(event) => onChange({ managerId: event.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            >
              <option value="">Todos os gestores</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Status</span>
            <select
              value={filters.status}
              onChange={(event) =>
                onChange({
                  status: event.target.value as DepartmentsFiltersType["status"],
                })
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            >
              <option value="">Todos</option>
              <option value="ON_TRACK">Saudável</option>
              <option value="ATTENTION">Atenção</option>
              <option value="AT_RISK">Em risco</option>
              <option value="NO_DATA">Sem dados</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[#4B5563]">
              <ArrowDownUp className="h-4 w-4" />
              Ordenar por
            </span>
            <select
              value={filters.sortBy}
              onChange={(event) =>
                onChange({
                  sortBy: event.target.value as DepartmentsFiltersType["sortBy"],
                })
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            >
              <option value="name">Nome</option>
              <option value="manager">Gestor</option>
              <option value="members">Colaboradores</option>
              <option value="cycles">Ciclos</option>
              <option value="progress">Progresso</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Direção</span>
            <select
              value={filters.sortOrder}
              onChange={(event) =>
                onChange({
                  sortOrder: event.target.value as DepartmentsFiltersType["sortOrder"],
                })
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            >
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
          </label>
        </div>
      ) : null}
    </div>
  );
}
