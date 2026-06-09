import { useEffect, useMemo, useState } from "react";
import { fetchStrategicCycles } from "../services/strategic-cycles.service";
import type {
  StrategicCyclesFilters,
  StrategicCyclesResponse,
} from "../types/strategic-cycles.types";

const defaultFilters: StrategicCyclesFilters = {
  search: "",
  departmentId: "",
  status: "",
  startDate: "",
  endDate: "",
};

export function useStrategicCycles() {
  const [data, setData] = useState<StrategicCyclesResponse | null>(null);
  const [filters, setFilters] = useState<StrategicCyclesFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestFilters = useMemo(
    () => ({
      search: filters.search,
      departmentId: filters.departmentId,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    [
      filters.search,
      filters.departmentId,
      filters.status,
      filters.startDate,
      filters.endDate,
    ],
  );

  useEffect(() => {
    let active = true;

    async function loadStrategicCycles() {
      try {
        setLoading(true);
        const response = await fetchStrategicCycles(requestFilters);

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar os ciclos estratégicos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStrategicCycles();

    return () => {
      active = false;
    };
  }, [
    requestFilters,
    reloadToken,
  ]);

  return {
    data,
    filters,
    loading,
    error,
    setFilters: (nextFilters: Partial<StrategicCyclesFilters>) =>
      setFilters((currentFilters) => ({
        ...currentFilters,
        ...nextFilters,
      })),
    resetFilters: () => setFilters(defaultFilters),
    reload: () => setReloadToken((current) => current + 1),
  };
}
