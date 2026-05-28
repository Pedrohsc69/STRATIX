import { useEffect, useState } from "react";
import { fetchEmployees } from "../services/employees.service";
import type { EmployeesFilters, EmployeesResponse } from "../types/employees.types";

const defaultFilters: EmployeesFilters = {
  search: "",
  departmentId: "",
  role: "",
  status: "",
  sortBy: "name",
  sortOrder: "asc",
};

export function useEmployees() {
  const [data, setData] = useState<EmployeesResponse | null>(null);
  const [filters, setFilters] = useState<EmployeesFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      try {
        setLoading(true);
        const response = await fetchEmployees(filters);

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar os funcionários.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadEmployees();

    return () => {
      active = false;
    };
  }, [
    filters.search,
    filters.departmentId,
    filters.role,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
    reloadToken,
  ]);

  return {
    data,
    filters,
    loading,
    error,
    setFilters: (nextFilters: Partial<EmployeesFilters>) =>
      setFilters((currentFilters) => ({
        ...currentFilters,
        ...nextFilters,
      })),
    resetFilters: () => setFilters(defaultFilters),
    reload: () => setReloadToken((current) => current + 1),
  };
}
