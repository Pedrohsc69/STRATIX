import { ArrowDownUp, Plus, Search, X } from "lucide-react";
import type { DashboardRole } from "../../dashboard/dashboard.types";
import type {
  EmployeeDepartment,
  EmployeesFilters as EmployeesFiltersType,
} from "../types/employees.types";

type EmployeesFiltersProps = {
  role: DashboardRole;
  filters: EmployeesFiltersType;
  departments: EmployeeDepartment[];
  canInvite: boolean;
  onChange: (nextFilters: Partial<EmployeesFiltersType>) => void;
  onReset: () => void;
  onInvite: () => void;
};

export function EmployeesFilters({
  role,
  filters,
  departments,
  canInvite,
  onChange,
  onReset,
  onInvite,
}: EmployeesFiltersProps) {
  const showDepartmentFilter = role === "DIRECTOR";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Buscar por nome ou e-mail"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F8FAFC]"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </button>

          {canInvite ? (
            <button
              type="button"
              onClick={onInvite}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#143757]"
            >
              <Plus className="h-4 w-4" />
              Convidar funcionário
            </button>
          ) : null}
        </div>
      </div>

      <div className={`mt-4 grid grid-cols-1 gap-3 ${showDepartmentFilter ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {showDepartmentFilter ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4B5563]">Departamento</span>
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
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Função</span>
          <select
            value={filters.role}
            onChange={(event) =>
              onChange({
                role: event.target.value as EmployeesFiltersType["role"],
              })
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="">Todas</option>
            <option value="DIRECTOR">Diretor</option>
            <option value="MANAGER">Gestor</option>
            <option value="EMPLOYEE">Colaborador</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({
                status: event.target.value as EmployeesFiltersType["status"],
              })
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Ativo</option>
              <option value="PENDING">Pendente</option>
              <option value="EXPIRED">Expirado</option>
              <option value="DISABLED">Inativo</option>
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
                sortBy: event.target.value as EmployeesFiltersType["sortBy"],
              })
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="name">Nome</option>
            <option value="department">Departamento</option>
            <option value="role">Função</option>
            <option value="date">Data</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4B5563]">Direção</span>
          <select
            value={filters.sortOrder}
            onChange={(event) =>
              onChange({
                sortOrder: event.target.value as EmployeesFiltersType["sortOrder"],
              })
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#1E4E79]"
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>
        </label>
      </div>
    </div>
  );
}
