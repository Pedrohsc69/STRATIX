import { useEffect, useState } from "react";
import { fetchObjectives } from "../services/objectives.service";
import type { ObjectivesFilters, ObjectivesResponse } from "../types/objectives.types";

const defaultFilters: ObjectivesFilters = {
  search: "",
  departmentId: "",
  cycleId: "",
  status: "",
  priority: "",
};

export function useObjectives() {
  const [data, setData] = useState<ObjectivesResponse | null>(null);
  const [filters, setFilters] = useState<ObjectivesFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadObjectives() {
      try {
        setLoading(true);
        const response = await fetchObjectives(filters);

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar os objetivos estratégicos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadObjectives();

    return () => {
      active = false;
    };
  }, [filters.search, filters.departmentId, filters.cycleId, filters.status, filters.priority, reloadToken]);

  return {
    data,
    filters,
    loading,
    error,
    setFilters: (nextFilters: Partial<ObjectivesFilters>) =>
      setFilters((currentFilters) => ({
        ...currentFilters,
        ...nextFilters,
      })),
    resetFilters: () => setFilters(defaultFilters),
    reload: () => setReloadToken((current) => current + 1),
  };
}
