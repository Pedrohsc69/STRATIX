import { useEffect, useState } from "react";
import { fetchOkrs } from "../services/okrs.service";
import type { OkrsFilters, OkrsResponse } from "../types/okrs.types";

const defaultFilters: OkrsFilters = {
  search: "",
  departmentId: "",
  cycleId: "",
  objectiveId: "",
  responsibleId: "",
  status: "",
  ownOnly: false,
};

export function useOKRs() {
  const [data, setData] = useState<OkrsResponse | null>(null);
  const [filters, setFilters] = useState<OkrsFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadOkrs() {
      try {
        setLoading(true);
        const response = await fetchOkrs(filters);

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar os OKRs.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOkrs();

    return () => {
      active = false;
    };
  }, [
    filters.search,
    filters.departmentId,
    filters.cycleId,
    filters.objectiveId,
    filters.responsibleId,
    filters.status,
    filters.ownOnly,
    reloadToken,
  ]);

  return {
    data,
    filters,
    loading,
    error,
    setFilters: (nextFilters: Partial<OkrsFilters>) =>
      setFilters((currentFilters) => ({
        ...currentFilters,
        ...nextFilters,
      })),
    resetFilters: () => setFilters(defaultFilters),
    reload: () => setReloadToken((current) => current + 1),
  };
}
