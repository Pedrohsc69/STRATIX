import { useEffect, useState } from "react";
import { fetchDepartments } from "../services/departments.service";
import type {
  DepartmentsFilters,
  DepartmentsResponse,
} from "../types/departments.types";

const defaultFilters: DepartmentsFilters = {
  search: "",
  managerId: "",
  status: "",
  sortBy: "name",
  sortOrder: "asc",
};

export function useDepartments() {
  const [data, setData] = useState<DepartmentsResponse | null>(null);
  const [filters, setFilters] = useState<DepartmentsFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDepartments() {
      try {
        setLoading(true);
        const response = await fetchDepartments(filters);

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar os departamentos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDepartments();

    return () => {
      active = false;
    };
  }, [
    filters.search,
    filters.managerId,
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
    setFilters: (nextFilters: Partial<DepartmentsFilters>) =>
      setFilters((currentFilters) => ({
        ...currentFilters,
        ...nextFilters,
      })),
    resetFilters: () => setFilters(defaultFilters),
    reload: () => setReloadToken((current) => current + 1),
  };
}
